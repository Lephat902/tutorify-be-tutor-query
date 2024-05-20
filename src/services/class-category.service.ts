import {
    Injectable
} from '@nestjs/common';
import { ClassCategoryQueryDto } from 'src/dtos';
import { ClassCategory, Level, Subject } from 'src/entities';
import { ClassCategoryRepository } from 'src/repositories';
import { Brackets, SelectQueryBuilder } from 'typeorm';

type ReturnedLevel = Omit<Level, 'classCategories'>;
type ReturnedSubject = Omit<Subject, 'classCategories'>;
type ReturnedClassCategory = {
    id: string;
    slug: string;
    level: ReturnedLevel;
    subject: ReturnedSubject;
    tutorCount?: number;
};

@Injectable()
export class ClassCategoryService {
    constructor(
        private readonly classCategoryRepository: ClassCategoryRepository,
    ) { }

    async findAll(filters: ClassCategoryQueryDto): Promise<ReturnedClassCategory[]> {
        const query = this.buildFindAllQuery(filters);
        const result = await query.getRawMany();
        return this.transformResults(result);
    }

    private buildFindAllQuery(filters: ClassCategoryQueryDto): SelectQueryBuilder<ClassCategory> {
        const query = this.classCategoryRepository
            .createQueryBuilder('classCategory')
            .leftJoin('classCategory.subject', 'subject')
            .leftJoin('classCategory.level', 'level')
            .select(['classCategory', 'subject', 'level']);

        this.filterBySearchQuery(query, filters.q);
        this.filterByIds(query, filters.ids);
        this.filterBySlugs(query, filters.slugs);

        if (filters.includeTutorCount) {
            query
                .leftJoin('classCategory.tutors', 'tutor')
                .andWhere('tutor.isApproved = true')
                .andWhere('tutor.emailVerified = true')
                .addSelect('COUNT(tutor.id)', 'tutorCount')
                .addOrderBy('COUNT(tutor.id)', 'DESC');

            // Required by AGGREGATE function COUNT
            query.addGroupBy('classCategory.id');
            query.addGroupBy('subject.id');
            query.addGroupBy('level.id');
        }

        // Automatically order by subject name and then level name
        query
            .addOrderBy('subject.name', 'ASC')
            .addSelect('CAST(SUBSTRING(level.name, 1) AS INTEGER)', 'numeric_name')
            .addOrderBy('numeric_name', 'ASC');

        return query;
    }

    private filterBySearchQuery(query: SelectQueryBuilder<ClassCategory>, q: string | undefined) {
        if (q) {
            query.andWhere(
                new Brackets((qb) => {
                    qb.where('subject.name ILIKE :q', { q: `%${q}%` })
                        .orWhere('level.name ILIKE :q', { q: `%${q}%` });
                }),
            );
        }
    }

    private filterByIds(query: SelectQueryBuilder<ClassCategory>, ids: string[] | undefined) {
        if (ids?.length) {
            query.andWhere('classCategory.id IN (:...ids)', {
                ids
            });
        }
    }

    private filterBySlugs(query: SelectQueryBuilder<ClassCategory>, slugs: string[] | undefined) {
        if (slugs?.length) {
            query.andWhere('classCategory.slug IN (:...slugs)', {
                slugs
            });
        }
    }

    private transformResults(classCategories: any[]): ReturnedClassCategory[] {
        return classCategories.map(item => this.transformResult(item));
    }

    private transformResult(classCategory: any): ReturnedClassCategory {
        return {
            id: classCategory.classCategory_id,
            slug: classCategory.classCategory_slug,
            subject: {
                id: classCategory.subject_id,
                name: classCategory.subject_name,
            },
            level: {
                id: classCategory.level_id,
                name: classCategory.level_name,
            },
            tutorCount: classCategory.tutorCount
        } as ReturnedClassCategory
    }
}
