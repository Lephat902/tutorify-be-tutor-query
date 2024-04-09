import { Brackets, DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Tutor } from './entities';
import { TutorQueryDto } from './dtos';
import { Gender, SortingDirection, StoredLocation, TutorOrderBy } from '@tutorify/shared';

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
    ): Promise<{
        results: Tutor[],
        totalCount: number,
    }> {
        const tutorQuery = this.createQueryBuilderWithEagerLoading();
        console.log(filters);

        // Apply filters to query 
        // Location has higher priority than class category
        const locationToOrder = filters.location || filters?.userPreferences?.location;
        if (locationToOrder)
            this.orderByLocationPriority(tutorQuery, locationToOrder);
        // classCategoryIds takes precedence over userPreferences.classCategoryIds
        if (filters?.classCategoryIds) {
            this.filterByCategoryIds(tutorQuery, filters.classCategoryIds);
        } else if (filters?.userPreferences?.classCategoryIds) {
            this.orderByCategoryPriority(tutorQuery, filters.userPreferences.classCategoryIds)
        }
        this.filterBySubjectIds(tutorQuery, filters?.subjectIds);
        this.filterByLevelIds(tutorQuery, filters?.levelIds);
        this.filterBySearchQuery(tutorQuery, filters.q);
        // If this specified, it will overwrite the order specified by userPreferences.classCategoryIds
        await this.orderByField(tutorQuery, filters.order, filters.dir, filters.showZeroFeedbacksTutorsInRatingSorting);
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
                .addOrderBy("priority", "ASC", "NULLS LAST");
        }
    }

    // Make classes that are nearest to the top of the result, others at last
    private orderByLocationPriority(query: SelectQueryBuilder<Tutor>, location: StoredLocation) {
        if (location) {
            const longitude = location.coordinates[0];
            const latitude = location.coordinates[1];

            query
                .addSelect(`
                    ST_DistanceSphere(
                        ST_GeomFromGeoJSON('{"type":"Point","coordinates":[${longitude},${latitude}]}'),
                        tutor.location
                    )`, 'distance')
                .addOrderBy('distance', 'ASC', 'NULLS LAST');
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

    private async orderByField(
        query: SelectQueryBuilder<Tutor>,
        order: TutorOrderBy | undefined,
        dir: SortingDirection | undefined,
        showZeroFeedbacksTutorsInRatingSorting: boolean | undefined,
    ) {
        if (!order) return;

        if (order === TutorOrderBy.RATING_STAR) {
            await this.orderByRatingStar(query, showZeroFeedbacksTutorsInRatingSorting);
        } else {
            query.orderBy(`tutor.${order}`, dir || SortingDirection.ASC);
        }
    }

    private async orderByRatingStar(
        query: SelectQueryBuilder<Tutor>,
        showZeroFeedbacksTutorsInRatingSorting: boolean | undefined,
    ) {
        const M = process.env.BAYESIAN_AVERAGE_M;
        const averageRating = await this.calculateAverageRating();

        if (showZeroFeedbacksTutorsInRatingSorting) {
            this.addBayesianAverageWithZeroFeedbacksTutors(query, M, averageRating);
        } else {
            this.addBayesianAverage(query, M, averageRating);
        }

        query
            .orderBy("bayesian_average", "DESC", 'NULLS LAST')
            .addGroupBy('tutor.id')
            .addGroupBy('proficiencies.id')
            .addGroupBy('subject.id')
            .addGroupBy('level.id');
    }

    private async calculateAverageRating() {
        const { averageRating } = await this.createQueryBuilder('tutor')
            .select("AVG(tutor.totalFeedbackRating / tutor.feedbackCount)", "averageRating")
            .where("tutor.feedbackCount > 0")
            .getRawOne();

        return averageRating;
    }

    private addBayesianAverage(
        query: SelectQueryBuilder<Tutor>,
        M: string,
        averageRating: number,
    ) {
        query.addSelect(`((tutor.feedbackCount / (tutor.feedbackCount + :M)) * (tutor.totalFeedbackRating / tutor.feedbackCount) + (:M / (tutor.feedbackCount + :M)) * :averageRating)`, "bayesian_average")
            .setParameter("M", M)
            .setParameter("averageRating", averageRating)
            .andWhere("tutor.feedbackCount > 0");
    }

    private addBayesianAverageWithZeroFeedbacksTutors(
        query: SelectQueryBuilder<Tutor>,
        M: string,
        averageRating: number,
    ) {
        query.addSelect(subQuery => {
            return subQuery
                .select(`((tutor.feedbackCount / (tutor.feedbackCount + :M)) * (tutor.totalFeedbackRating / tutor.feedbackCount) + (:M / (tutor.feedbackCount + :M)) * :averageRating)`)
                .from(Tutor, "tutor1")
                .andWhere("tutor1.id = tutor.id")
                .setParameter("M", M)
                .setParameter("averageRating", averageRating)
                .andWhere("tutor.feedbackCount > 0");
        }, "bayesian_average");
    }
}