import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { ClassCategory } from './class-category.entity';

@Entity()
export class Subject {
  @PrimaryColumn()
  id: string;

  @Column({ default: "" })
  name: string;
  
  @OneToMany(() => ClassCategory, classCategory => classCategory.subject)
  classCategories: ClassCategory[];
}