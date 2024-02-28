import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';
import { ClassCategoryCreatedEventPattern, ClassCategoryCreatedEventPayload, TutorProficiencyCreatedEventPattern, TutorProficiencyCreatedEventPayload, TutorProficiencyDeletedEventPattern, TutorProficiencyDeletedEventPayload, UserCreatedEventPattern, UserCreatedEventPayload, UserRole } from '@tutorify/shared';
import { TutorQueryService } from './tutor-query.service';
import { TutorQueryDto } from './dtos';

@Controller()
export class TutorQueryController {
    constructor(
        private readonly tutorQueryService: TutorQueryService,
    ) { }

    @EventPattern(new UserCreatedEventPattern())
    async handleUserCreated(payload: UserCreatedEventPayload) {
        const { userId, role } = payload;
        if (role !== UserRole.TUTOR) {
            console.log("Tutor query service doesn't care if there is any user with other roles created!");
            return;
        }
        console.log('Start inserting new tutor to tutor-query database');

        await this.tutorQueryService.handleTutorCreated(userId);
    }

    @EventPattern(new TutorProficiencyCreatedEventPattern())
    async handleTutorProficiencyCreated(payload: TutorProficiencyCreatedEventPayload) {
        const { tutorId, classCategoryId } = payload;
        console.log('Start inserting new tutor proficiency to tutor-query database');
        await this.tutorQueryService.handleTutorProficiencyCreated(tutorId, classCategoryId);
    }

    @EventPattern(new TutorProficiencyDeletedEventPattern())
    async handleTutorProficiencyDeleted(payload: TutorProficiencyDeletedEventPayload) {
        const { tutorId, classCategoryId } = payload;
        console.log('Start removing new tutor proficiency to tutor-query database')
        await this.tutorQueryService.handleTutorProficiencyDeleted(tutorId, classCategoryId);
    }

    @EventPattern(new ClassCategoryCreatedEventPattern())
    async handleClassCategoryCreated(payload: ClassCategoryCreatedEventPayload) {
        const { classCategoryId, levelId, subjectId } = payload;
        console.log('Start inserting new class category to tutor-query database')
        await this.tutorQueryService.handleClassCategoryCreated(classCategoryId, levelId, subjectId);
    }

    @MessagePattern({ cmd: 'getTutors'})
    async getTutors(filters: TutorQueryDto) {
        return this.tutorQueryService.getTutors(filters);
    }
}
