import { Gender } from "@tutorify/shared";
import { Geometry } from 'geojson';
import { Column, PrimaryColumn } from "typeorm";
import { FileObject } from "./file-object.entity";

export abstract class User {
    @PrimaryColumn()
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ unique: true })
    username: string;

    @Column({ nullable: true })
    firstName: string;

    @Column({ nullable: true })
    middleName: string;

    @Column({ nullable: true })
    lastName: string;

    @Column({ type: 'enum', enum: Gender, nullable: true })
    gender: Gender;

    @Column({ type: 'jsonb', nullable: true })
    avatar: FileObject;

    @Column({ nullable: true })
    emailVerified: boolean;

    @Column({ nullable: true })
    isBlocked: boolean;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    wardId: string;

    @Column({ type: 'geometry', spatialFeatureType: 'Point', nullable: true })
    location: Geometry;
}
