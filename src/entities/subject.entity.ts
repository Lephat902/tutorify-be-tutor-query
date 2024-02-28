import { Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { ClassCategory } from './class-category.entity';

@Entity()
export class Subject {
  @PrimaryColumn()
  id: string;

  @OneToMany(() => ClassCategory, classCategory => classCategory.subject)
  classCategories: ClassCategory[];
}