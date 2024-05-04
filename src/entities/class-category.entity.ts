import { Entity, Unique, ManyToOne, PrimaryColumn, Column } from 'typeorm';
import { Subject } from './subject.entity';
import { Level } from './level.entity';

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
}