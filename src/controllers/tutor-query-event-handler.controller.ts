import { Controller } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import {
  ClassCategoryCreatedEventPattern,
  ClassCategoryCreatedEventPayload,
  TutorApprovedEventPattern,
  TutorApprovedEventPayload,
  TutorProficiencyCreatedEventPattern,
  TutorProficiencyCreatedEventPayload,
  TutorProficiencyDeletedEventPattern,
  TutorProficiencyDeletedEventPayload,
  UserBlockedEventPattern,
  UserBlockedEventPayload,
  UserCreatedEventPattern,
  UserCreatedEventPayload,
  UserEmailVerifiedEventPattern,
  UserEmailVerifiedEventPayload,
  UserUnblockedEventPattern,
  UserUnblockedEventPayload,
  UserRole,
  FeedbackCreatedEventPattern,
  FeedbackCreatedEventPayload,
} from "@tutorify/shared";
import { TutorQueryService } from "../tutor-query.service";

@Controller()
export class TutorQueryEventHandlerController {
  constructor(private readonly tutorQueryService: TutorQueryService) {}

  @EventPattern(new UserCreatedEventPattern())
  async handleUserCreated(payload: UserCreatedEventPayload) {
    const { userId, role } = payload;
    if (role !== UserRole.TUTOR) {
      console.log(
        "Tutor query service doesn't care if there is any user with other roles created!"
      );
      return;
    }
    console.log("Start inserting new tutor to tutor-query database");

    await this.tutorQueryService.handleTutorCreated(userId);
  }

  @EventPattern(new TutorApprovedEventPattern())
  async handleTutorApprovedEvent(payload: TutorApprovedEventPayload) {
    console.log("Start updating tutor to tutor-query database");
    const { tutorId } = payload;
    await this.tutorQueryService.updateTutor(tutorId, { isApproved: true });
  }

  @EventPattern(new UserEmailVerifiedEventPattern())
  async handleUserEmailVerified(payload: UserEmailVerifiedEventPayload) {
    console.log("Start updating tutor to tutor-query database");
    const { userId } = payload;
    // no need to check userRole, user with role other than TUTOR not exist in the DB
    await this.tutorQueryService.updateTutor(userId, { emailVerified: true });
  }

  @EventPattern(new UserBlockedEventPattern())
  async handleUserBlocked(payload: UserBlockedEventPayload) {
    console.log("Start updating tutor to tutor-query database");
    const { userId } = payload;
    // no need to check userRole, user with role other than TUTOR not exist in the DB
    await this.tutorQueryService.updateTutor(userId, { isBlocked: true });
  }

  @EventPattern(new UserUnblockedEventPattern())
  async handleUserUnblocked(payload: UserUnblockedEventPayload) {
    console.log("Start updating tutor to tutor-query database");
    const { userId } = payload;
    // no need to check userRole, user with role other than TUTOR not exist in the DB
    await this.tutorQueryService.updateTutor(userId, { isBlocked: false });
  }

  @EventPattern(new TutorProficiencyCreatedEventPattern())
  async handleTutorProficiencyCreated(
    payload: TutorProficiencyCreatedEventPayload
  ) {
    const { tutorId, classCategoryId } = payload;
    console.log(
      "Start inserting new tutor proficiency to tutor-query database"
    );
    await this.tutorQueryService.handleTutorProficiencyCreated(
      tutorId,
      classCategoryId
    );
  }

  @EventPattern(new TutorProficiencyDeletedEventPattern())
  async handleTutorProficiencyDeleted(
    payload: TutorProficiencyDeletedEventPayload
  ) {
    const { tutorId, classCategoryId } = payload;
    console.log("Start removing new tutor proficiency to tutor-query database");
    await this.tutorQueryService.handleTutorProficiencyDeleted(
      tutorId,
      classCategoryId
    );
  }

  @EventPattern(new ClassCategoryCreatedEventPattern())
  async handleClassCategoryCreated(payload: ClassCategoryCreatedEventPayload) {
    const { classCategoryId, level, subject } = payload;
    console.log("Start inserting new class category to tutor-query database");
    await this.tutorQueryService.handleClassCategoryCreated(
      classCategoryId,
      level,
      subject
    );
  }

  @EventPattern(new FeedbackCreatedEventPattern())
  async handleFeedbackCreated(payload: FeedbackCreatedEventPayload) {
    const { tutorId, rate } = payload;
    console.log(
      "Start increase rate and total feedbacks to tutor-query database"
    );
    await this.tutorQueryService.handleFeedbackCreated(tutorId, rate);
  }
}
