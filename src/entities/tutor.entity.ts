import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { User } from './user.entity.abstract';
import { ClassCategory } from './class-category.entity';
import { FileObject } from './file-object.entity';

@Entity()
export class Tutor extends User {
  @ManyToMany(() => ClassCategory)
  @JoinTable({ name: 'tutor_proficient_in_class_category' })
  proficiencies: ClassCategory[];

  @Column()
  biography: string;

  @Column()
  isApproved: boolean;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column()
  minimumWage: string;

  @Column()
  currentWorkplace: string;

  @Column()
  currentPosition: string;

  @Column()
  major: string;

  @Column({ nullable: true })
  graduationYear: number;

  @Column({ type: 'jsonb' })
  tutorPortfolios: FileObject[];
}