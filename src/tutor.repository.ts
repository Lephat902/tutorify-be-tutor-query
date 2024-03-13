import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Tutor } from './entities';
import { TutorQueryDto } from './dtos';

@Injectable()
export class TutorRepository extends Repository<Tutor> {
    constructor(private dataSource: DataSource) {
        super(Tutor, dataSource.createEntityManager());
    }

    async getFullTutorById(id: string) {
        let query = this.createQueryBuilderWithEagerLoading();
        query = query.andWhere('tutor.id = :id', { id });
        return query.getOne();
    }

    async updateTutorById(id: string, updatedFields: Partial<Tutor>): Promise<Tutor> {
        const tutor = await this.findOneBy({ id });

        if (!tutor) {
            throw new NotFoundException(`Tutor with id ${id} not found`);
        }

        Object.assign(tutor, updatedFields);

        return this.save(tutor);
    }

    async findByFieldsWithFilters(
        fields: Record<string, any>,
        filters?: TutorQueryDto,
        includeTotalCount: boolean = true
    ): Promise<Tutor[] | {
        results: Tutor[],
        totalCount: number,
    }> {
        let classQuery = this.createQueryBuilderWithEagerLoading();

        // Filter by fields if provided
        for (const [field, value] of Object.entries(fields)) {
            classQuery = classQuery.andWhere(`tutor.${field} = :value`, { value });
        }

        // Apply additional filters if provided
        if (filters) {
            classQuery = this.applyAdditionalFilters(classQuery, filters);
        }

        const results = await classQuery.getMany();
        if (includeTotalCount) {
            // Execute count query to get total count
            const totalCount = await classQuery.getCount();
            return { results, totalCount };
        } else {
            return results;
        }
    }

    private createQueryBuilderWithEagerLoading(): SelectQueryBuilder<Tutor> {
        return this.dataSource.createQueryBuilder(Tutor, 'tutor')
            .leftJoinAndSelect('tutor.proficiencies', 'proficiencies')
            .leftJoinAndSelect('proficiencies.subject', 'subject')
            .leftJoinAndSelect('proficiencies.level', 'level');
    }

    private applyAdditionalFilters(query: SelectQueryBuilder<Tutor>, filters: TutorQueryDto) {
        if (filters.order) {
            query = query.orderBy(`tutor.${filters.order}`, filters.dir || 'ASC');
        }
        if (filters.page && filters.limit) {
            query = query.skip((filters.page - 1) * filters.limit).take(filters.limit);
        }
        if (filters.classCategoryIds && filters.classCategoryIds.length > 0) {
            query = query
                .leftJoin('tutor.proficiencies', 'filteredProficiencies')
                .andWhere('filteredProficiencies.id IN (:...classCategoryIds)', { classCategoryIds: filters.classCategoryIds });
        }
        if (filters.subjectIds && filters.subjectIds.length > 0) {
            query = query
                .leftJoin('tutor.proficiencies', 'filteredProficiencies')
                .andWhere('filteredProficiencies.subject.id IN (:...subjectIds)', { subjectIds: filters.subjectIds });
        }
        if (filters.levelIds && filters.levelIds.length > 0) {
            query = query
                .leftJoin('tutor.proficiencies', 'filteredProficiencies')
                .andWhere('filteredProficiencies.level.id IN (:...levelIds)', { levelIds: filters.levelIds });
        }
        if (filters.q) {
            const qParam = `%${filters.q}%`;
            query = query.andWhere('(tutor.biography ILIKE :q OR tutor.firstName ILIKE :q OR tutor.lastName ILIKE :q OR tutor.username ILIKE :q)', { q: qParam });
        }
        if (filters.gender) {
            query = query.andWhere('tutor.gender = :gender', { gender: filters.gender });
        }
        if (!filters.includeBlocked) {
            query = query.andWhere('tutor.isBlocked = :isBlocked', { isBlocked: false });
        }
        if (!filters.includeEmailNotVerified) {
            query = query.andWhere('tutor.emailVerified = :emailVerified', { emailVerified: true });
        }
        if (!filters.includeNotApproved) {
            query = query.andWhere('tutor.isApproved = :isApproved', { isApproved: true });
        }
        if (filters.minWage !== undefined) {
            query = query.andWhere('tutor.minimumWage >= :minWage', { minWage: filters.minWage });
        }
        if (filters.maxWage !== undefined) {
            query = query.andWhere('tutor.minimumWage <= :maxWage', { maxWage: filters.maxWage });
        }

        return query;
    }
}
