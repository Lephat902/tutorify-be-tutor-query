import { Controller } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import {
  ClassCategoryCreatedEventPattern,
  ClassCategoryCreatedEventPayload,
  TutorApprovedEventPattern,
  TutorApprovedEventPayload,
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
  UserUpdatedEventPattern,
  UserUpdatedEventPayload,
  ClassApplicationUpdatedEventPattern,
  ClassApplicationUpdatedEventPayload,
  ApplicationStatus,
  ClassCategoriesPreferenceCreatedEventPattern,
  ClassCategoriesPreferenceCreatedEventPayload,
  ClassCategoriesPreferenceDeletedEventPayload,
  ClassCategoriesPreferenceDeletedEventPattern,
  UserDeletedEventPattern,
  UserDeletedEventPayload,
} from "@tutorify/shared";
import { TutorQueryService } from "../tutor-query.service";
import { MutexService } from "src/mutexes";

@Controller()
export class TutorQueryEventHandlerController {
  constructor(
    private readonly tutorQueryService: TutorQueryService,
    private readonly mutexService: MutexService,
  ) { }

  @EventPattern(new UserCreatedEventPattern())
  async handleUserCreated(payload: UserCreatedEventPayload) {
    await this.handleUserCreateOrUpdated(payload);
  }

  @EventPattern(new UserUpdatedEventPattern())
  async handleUserUpdated(payload: UserUpdatedEventPayload) {
    await this.handleUserCreateOrUpdated(payload);
  }

  @EventPattern(new UserDeletedEventPattern())
  async handleUserDeleted(payload: UserDeletedEventPayload) {
    const { userId } = payload;
    await this.tutorQueryService.handleTutorDeleted(userId);
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
    const { userId } = payload;
    // Lock the mutex
    const release = await this.mutexService.acquireLockForClassSession(userId);
    try {
      console.log("Start updating tutor to tutor-query database");
      // no need to check userRole, user with role other than TUTOR not exist in the DB
      await this.tutorQueryService.updateTutor(userId, { isBlocked: true });
    } finally {
      // Release the mutex
      release();
    }
  }

  @EventPattern(new UserUnblockedEventPattern())
  async handleUserUnblocked(payload: UserUnblockedEventPayload) {
    const { userId } = payload;
    // Lock the mutex
    const release = await this.mutexService.acquireLockForClassSession(userId);
    try {
      console.log("Start updating tutor to tutor-query database");
      // no need to check userRole, user with role other than TUTOR not exist in the DB
      await this.tutorQueryService.updateTutor(userId, { isBlocked: false });
    } finally {
      // Release the mutex
      release();
    }
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
    // Lock the mutex
    const release = await this.mutexService.acquireLockForClassSession(tutorId);
    try {
      console.log(
        "Start increase rate and total feedbacks to tutor-query database"
      );
      await this.tutorQueryService.handleFeedbackCreated(tutorId, rate);
    } finally {
      // Release the mutex
      release();
    }
  }

  @EventPattern(new ClassApplicationUpdatedEventPattern())
  async handleClassApplicationUpdated(payload: ClassApplicationUpdatedEventPayload) {
    const { tutorId, newStatus } = payload;
    if (newStatus !== ApplicationStatus.APPROVED) {
      console.log(`Not interested in ${newStatus} status of the application`);
      return;
    }
    // Lock the mutex
    const release = await this.mutexService.acquireLockForClassSession(tutorId);
    try {
      console.log("Start increase numberOfClasses to tutor-query database");
      await this.tutorQueryService.handleClassApplicationUpdated(tutorId);
    } finally {
      // Release the mutex
      release();
    }
  }

  @EventPattern(new ClassCategoriesPreferenceCreatedEventPattern())
  async handleClassCategoriesPreferenceCreated(payload: ClassCategoriesPreferenceCreatedEventPayload) {
    const { userId, classCategoryIds } = payload;
    // Lock the mutex
    const release = await this.mutexService.acquireLockForClassSession(userId);
    try {
      console.log("Start adding new tutor proficiencies");
      return this.tutorQueryService.addTutorProficiencies(userId, classCategoryIds);
    } finally {
      // Release the mutex
      release();
    }
  }

  @EventPattern(new ClassCategoriesPreferenceDeletedEventPattern())
  async handleClassCategoriesPreferenceDeleted(payload: ClassCategoriesPreferenceDeletedEventPayload) {
    const { userId, classCategoryIds } = payload;
    // Lock the mutex
    const release = await this.mutexService.acquireLockForClassSession(userId);
    try {
      console.log("Start deleting tutor proficiencies");
      return this.tutorQueryService.deleteTutorProficiencies(userId, classCategoryIds);
    } finally {
      // Release the mutex
      release();
    }
  }

  private async handleUserCreateOrUpdated(payload: UserCreatedEventPayload | UserUpdatedEventPayload) {
    const { userId, role } = payload;
    if (role !== UserRole.TUTOR) {
      console.log(
        "Tutor query service doesn't care if there is any user with other roles created/updated!"
      );
      return;
    }

    // Lock the mutex
    const release = await this.mutexService.acquireLockForClassSession(userId);
    try {
      console.log("Start creating/updating tutor in tutor-query database");
      await this.tutorQueryService.handleTutorCreatedOrUpdated(userId);
    } finally {
      // Release the mutex
      release();
    }
  }
}
