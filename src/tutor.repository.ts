import { Brackets, DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Tutor } from './entities';
import { TutorQueryDto } from './dtos';
import { Gender, TutorOrderBy } from '@tutorify/shared';

@Injectable()
export class TutorRepository extends Repository<Tutor> {
    constructor(private dataSource: DataSource) {
        super(Tutor, dataSource.createEntityManager());
    }

    async getFullTutorById(id: string) {
        const query = this.createQueryBuilderWithEagerLoading();
        query.andWhere('tutor.id = :id', { id });
        return query.getOne();
    }

    async updateTutorById(id: string, updatedFields: Partial<Tutor>): Promise<Tutor> {
        const tutor = await this.findOneBy({ id });

        if (!tutor) {
            throw new NotFoundException(`Tutor with id ${id} not found`);
        }

        this.merge(tutor, updatedFields);

        return this.save(tutor);
    }

    async getTutorsAndTotalCount(
        filters: TutorQueryDto,
    ): Promise<Tutor[] | {
        results: Tutor[],
        totalCount: number,
    }> {
        const tutorQuery = this.createQueryBuilderWithEagerLoading();

        // Apply filters to query 
        // classCategoryIds takes precedence over classCategoryPreferences.classCategoryIds
        if (filters?.classCategoryIds) {
            this.filterByCategoryIds(tutorQuery, filters.classCategoryIds);
        } else if (filters?.classCategoryPreferences?.classCategoryIds) {
            this.orderByCategoryPriority(tutorQuery, filters.classCategoryPreferences.classCategoryIds)
        }
        this.filterBySubjectIds(tutorQuery, filters?.subjectIds);
        this.filterByLevelIds(tutorQuery, filters?.levelIds);
        this.filterBySearchQuery(tutorQuery, filters.q);
        // If this specified, it will overwrite the order specified by classCategoryPreferences.classCategoryIds
        this.orderByField(tutorQuery, filters.order, filters.dir);
        this.paginateResults(tutorQuery, filters.page, filters.limit);
        this.filterByGender(tutorQuery, filters.gender);
        this.filterByBlockedStatus(tutorQuery, filters.includeBlocked);
        this.filterByEmailVerification(tutorQuery, filters.includeEmailNotVerified);
        this.filterByApprovalStatus(tutorQuery, filters.includeNotApproved);
        this.filterByMinWage(tutorQuery, filters.minWage);
        this.filterByMaxWage(tutorQuery, filters.maxWage);

        const [results, totalCount] = await tutorQuery.getManyAndCount();
        return { results, totalCount };
    }

    private createQueryBuilderWithEagerLoading(): SelectQueryBuilder<Tutor> {
        return this.dataSource.createQueryBuilder(Tutor, 'tutor')
            .leftJoinAndSelect('tutor.proficiencies', 'proficiencies')
            .leftJoinAndSelect('proficiencies.subject', 'subject')
            .leftJoinAndSelect('proficiencies.level', 'level');
    }

    // Get only classes that satisfy classCategoryIds
    private filterByCategoryIds(query: SelectQueryBuilder<Tutor>, classCategoryIds: string[] | undefined) {
        if (classCategoryIds?.length) {
            query
                .andWhere('proficiencies.id IN (:...classCategoryIds)', { classCategoryIds });
        }
    }

    // Make classes that satisfy classCategoryIds to the top of the result, others at last
    private orderByCategoryPriority(query: SelectQueryBuilder<Tutor>, classCategoryIds: string[] | undefined) {
        // Assuming classCategoryIds is not empty and is relevant to the query
        if (classCategoryIds?.length) {
            // Apply order by using a CASE statement to prioritize matching category IDs
            query
                .addSelect(`(
                    CASE
                        WHEN proficiencies.id IN (:...classCategoryIds) THEN 0
                        ELSE 1
                    END)`, "priority")
                .setParameter("classCategoryIds", classCategoryIds)
                .orderBy("priority", "ASC", "NULLS LAST");
        }
    }

    private filterBySubjectIds(query: SelectQueryBuilder<Tutor>, subjectIds: string[] | undefined) {
        if (subjectIds?.length) {
            query
                .andWhere('proficiencies.subject.id IN (:...subjectIds)', { subjectIds });
        }
    }

    private filterByLevelIds(query: SelectQueryBuilder<Tutor>, levelIds: string[] | undefined) {
        if (levelIds?.length) {
            query
                .andWhere('proficiencies.level.id IN (:...levelIds)', { levelIds });
        }
    }

    private filterBySearchQuery(query: SelectQueryBuilder<Tutor>, q: string | undefined) {
        if (q) {
            query.andWhere(
                new Brackets((qb) => {
                    qb.where('tutor.biography ILIKE :q', { q: `%${q}%` })
                        .orWhere('tutor.firstName ILIKE :q', { q: `%${q}%` })
                        .orWhere('tutor.lastName ILIKE :q', { q: `%${q}%` })
                        .orWhere('tutor.username ILIKE :q', { q: `%${q}%` });
                }),
            );
        }
    }

    private paginateResults(query: SelectQueryBuilder<Tutor>, page: number | undefined, limit: number | undefined) {
        if (page && limit) {
            query
                .skip((page - 1) * limit)
                .take(limit);
        }
    }

    private filterByGender(query: SelectQueryBuilder<Tutor>, gender: Gender | undefined) {
        if (gender) {
            query.andWhere('tutor.gender = :gender', { gender });
        }
    }

    private filterByBlockedStatus(query: SelectQueryBuilder<Tutor>, includeBlocked: boolean | undefined) {
        if (!includeBlocked) {
            query.andWhere('tutor.isBlocked = :isBlocked', { isBlocked: false });
        }
    }

    private filterByEmailVerification(query: SelectQueryBuilder<Tutor>, includeEmailNotVerified: boolean | undefined) {
        if (!includeEmailNotVerified) {
            query.andWhere('tutor.emailVerified = :emailVerified', { emailVerified: true });
        }
    }

    private filterByApprovalStatus(query: SelectQueryBuilder<Tutor>, includeNotApproved: boolean | undefined) {
        if (!includeNotApproved) {
            query.andWhere('tutor.isApproved = :isApproved', { isApproved: true });
        }
    }

    private filterByMinWage(query: SelectQueryBuilder<Tutor>, minWage: number | undefined) {
        if (minWage !== undefined) {
            query.andWhere('tutor.minimumWage >= :minWage', { minWage });
        }
    }

    private filterByMaxWage(query: SelectQueryBuilder<Tutor>, maxWage: number | undefined) {
        if (maxWage !== undefined) {
            query.andWhere('tutor.minimumWage <= :maxWage', { maxWage });
        }
    }

    private orderByField(query: SelectQueryBuilder<Tutor>, order: TutorOrderBy | undefined, dir: 'ASC' | 'DESC' | undefined) {
        if (order) {
            query.orderBy(`tutor.${order}`, dir || 'ASC');
        }
    }
}