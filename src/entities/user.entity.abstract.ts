import { Column, PrimaryColumn } from "typeorm";
import { Geometry } from 'geojson';
import { Gender } from "@tutorify/shared";
import { Exclude } from "class-transformer";
import { FileObject } from "./file-object.entity";

export abstract class User {
    @PrimaryColumn()
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ unique: true })
    username: string;

    @Column()
    firstName: string;

    @Column()
    middleName: string;

    @Column()
    lastName: string;

    @Column({ type: 'enum', enum: Gender, nullable: true })
    gender: Gender;

    @Column({ type: 'jsonb', nullable: true })
    avatar: FileObject;

    @Column()
    emailVerified: boolean;

    @Column()
    isBlocked: boolean;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    wardId: string;

    @Column({ type: 'geometry', spatialFeatureType: 'Point', nullable: true })
    @Exclude()
    location: Geometry;
}