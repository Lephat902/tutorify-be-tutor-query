import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ClassCategory } from '../entities';

@Injectable()
export class ClassCategoryRepository extends Repository<ClassCategory> {
    constructor(private dataSource: DataSource) {
        super(ClassCategory, dataSource.createEntityManager());
    }
}