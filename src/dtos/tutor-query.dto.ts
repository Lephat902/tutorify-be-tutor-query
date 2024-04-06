import { IntersectionType } from "@nestjs/mapped-types";
import { PaginationDto, SortingDirectionDto, TutorOrderBy, Gender, StoredLocation } from "@tutorify/shared";

export class TutorQueryDto extends IntersectionType(
    PaginationDto,
    SortingDirectionDto,
) {
    readonly q: string;
    readonly gender: Gender;
    readonly includeEmailNotVerified: boolean;
    readonly includeBlocked: boolean;
    // Tutor
    readonly includeNotApproved: boolean;
    readonly order: TutorOrderBy;
    readonly classCategoryIds: string[];
    readonly levelIds: string[];
    readonly subjectIds: string[];
    readonly minWage: number;
    readonly maxWage: number;
    readonly userMakeRequest: UserMakeRequest;
    userPreferences: {
        classCategoryIds: string[];
        location: StoredLocation;
    };
    readonly wardId: string;
    readonly districtId: string;
    readonly provinceId: string;
    // Not user's input
    location: StoredLocation;
}

interface UserMakeRequest {
    userId: string;
}