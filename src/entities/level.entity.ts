import { Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { ClassCategory } from './class-category.entity';

@Entity()
export class Level {
  @PrimaryColumn()
  id: string;

  @OneToMany(() => ClassCategory, classCategory => classCategory.level)
  classCategories: ClassCategory[];
}