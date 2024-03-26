import { IntersectionType } from "@nestjs/mapped-types";
import { PaginationDto, SortingDirectionDto, TutorOrderBy, Gender } from "@tutorify/shared";

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
    classCategoryPreferences: {
        classCategoryIds: string[];
    };
}

interface UserMakeRequest {
    userId: string;
}