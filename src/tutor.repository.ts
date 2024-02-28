import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Tutor } from './entities';
import { TutorQueryDto } from './dtos';

@Injectable()
export class TutorRepository extends Repository<Tutor> {
    constructor(private dataSource: DataSource) {
        super(Tutor, dataSource.createEntityManager());
    }

    async findByFieldsWithFilters(fields: Record<string, any>, filters?: TutorQueryDto): Promise<Tutor[]> {
        let classQuery = this.createQueryBuilderWithEagerLoading();

        // Filter by fields if provided
        for (const [field, value] of Object.entries(fields)) {
            classQuery = classQuery.andWhere(`tutor.${field} = :value`, { value });
        }

        // Apply additional filters if provided
        if (filters) {
            classQuery = this.applyAdditionalFilters(classQuery, filters);
        }

        return classQuery.getMany();
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
            query = query.andWhere('proficiencies.id IN (:...classCategoryIds)', { classCategoryIds: filters.classCategoryIds });
        }
        if (filters.subjectIds && filters.subjectIds.length > 0) {
            query = query.andWhere('subject.id IN (:...subjectIds)', { subjectIds: filters.subjectIds });
        }
        if (filters.levelIds && filters.levelIds.length > 0) {
            query = query.andWhere('level.id IN (:...levelIds)', { levelIds: filters.levelIds });
        }
        if (filters.q) {
            const qParam = `%${filters.q}%`;
            query = query.andWhere('(tutor.biography ILIKE :q OR tutor.firstname ILIKE :q OR tutor.lastname ILIKE :q OR tutor.username ILIKE :q)', { q: qParam });
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

        return query;
    }
}
