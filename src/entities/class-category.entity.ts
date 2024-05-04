import { Entity, Unique, ManyToOne, PrimaryColumn, Column, ManyToMany } from 'typeorm';
import { Subject } from './subject.entity';
import { Level } from './level.entity';
import { Tutor } from './tutor.entity';

@Entity()
@Unique(['subject', 'level'])
export class ClassCategory {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true, nullable: true })
  slug: string;

  @ManyToOne(() => Subject, subject => subject.classCategories, { nullable: false, eager: true, cascade: true })
  subject: Subject;

  @ManyToOne(() => Level, level => level.classCategories, { nullable: false, eager: true, cascade: true })
  level: Level;

  @ManyToMany(() => Tutor, tutor => tutor.proficiencies)
  tutors: Tutor[];
}