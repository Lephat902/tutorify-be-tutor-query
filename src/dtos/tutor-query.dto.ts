import { PaginationDto, SortingDirectionDto, applyMixins, TutorOrderBy, Gender } from "@tutorify/shared";

class TutorQueryDto {
    readonly q?: string;
    readonly gender?: Gender;
    readonly includeEmailNotVerified?: boolean;
    readonly includeBlocked?: boolean;
    // Tutor
    readonly includeNotApproved?: boolean;
    readonly order?: TutorOrderBy;
    readonly classCategoryIds?: string[];
    readonly levelIds?: string[];
    readonly subjectIds?: string[];
}

interface TutorQueryDto extends PaginationDto, SortingDirectionDto { }
applyMixins(TutorQueryDto, [PaginationDto, SortingDirectionDto]);

export { TutorQueryDto };