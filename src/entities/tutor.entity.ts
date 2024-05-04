import { Entity, Column, ManyToMany, JoinTable } from "typeorm";
import { User } from "./user.entity.abstract";
import { ClassCategory } from "./class-category.entity";
import { FileObject } from "./file-object.entity";
import { SocialProfile } from "./social-profile.entity";
import { Type } from "class-transformer";

@Entity()
export class Tutor extends User {
  @ManyToMany(() => ClassCategory, category => category.tutors)
  @JoinTable({ name: "tutor_proficient_in_class_category" })
  proficiencies: ClassCategory[];

  @Column({ nullable: true })
  biography: string;

  @Column({ nullable: true })
  isApproved: boolean;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ default: 0 })
  minimumWage: number;

  @Column({ nullable: true })
  currentWorkplace: string;

  @Column({ nullable: true })
  currentPosition: string;

  @Column({ nullable: true })
  major: string;

  @Column({ nullable: true })
  graduationYear: number;

  @Column({ type: "jsonb", nullable: true })
  tutorPortfolios: FileObject[];

  @Column({ type: "jsonb", nullable: true })
  @Type(() => SocialProfile)
  socialProfiles: SocialProfile[];

  @Column({ default: 0 })
  numOfClasses: number;

  @Column({ type: 'real', default: '0' })
  feedbackCount: string;

  @Column({ type: 'real', default: '0' })
  totalFeedbackRating: string;
}
