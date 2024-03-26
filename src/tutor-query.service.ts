import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ClassCategory, Tutor } from "./entities";
import { Repository } from "typeorm";
import { LevelDto, QueueNames, SubjectDto } from "@tutorify/shared";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom, timeout } from "rxjs";
import { TutorQueryDto, UserPreferences } from "./dtos";
import { TutorRepository } from "./tutor.repository";

@Injectable()
export class TutorQueryService {
  constructor(
    private readonly tutorRepository: TutorRepository,
    @InjectRepository(ClassCategory)
    private readonly classCategoryRepository: Repository<ClassCategory>,
    @Inject(QueueNames.AUTH)
    private readonly authClient: ClientProxy,
    @Inject(QueueNames.USER_PREFERENCES)
    private readonly userPreferencesClient: ClientProxy,
  ) { }

  async handleTutorCreatedOrUpdated(tutorId: string) {
    // Event payload contains just a small amount of data
    // So that it's neccessary to fetch the full data from auth service
    const fullTutorData = await firstValueFrom(
      this.authClient.send<Tutor>({ cmd: "getUserById" }, tutorId)
    );
    await this.tutorRepository.save(fullTutorData);
  }

  async handleTutorProficiencyCreated(
    tutorId: string,
    classCategoryId: string
  ) {
    // Fetch tutor along with proficiencies from database
    const tutor = await this.tutorRepository.findOne({
      where: { id: tutorId },
      relations: { proficiencies: true },
    });

    // Add class category to tutor's proficiencies
    tutor.proficiencies.push({
      id: classCategoryId,
    } as ClassCategory);

    // Save updated tutor
    await this.tutorRepository.save(tutor);
  }

  async handleTutorProficiencyDeleted(
    tutorId: string,
    classCategoryId: string
  ) {
    // Fetch tutor along with proficiencies from database
    const tutor = await this.tutorRepository.findOne({
      where: { id: tutorId },
      relations: { proficiencies: true },
    });

    // Remove class category from tutor's proficiencies
    tutor.proficiencies = tutor.proficiencies.filter(
      (category) => category.id !== classCategoryId
    );

    // Save updated tutor
    await this.tutorRepository.save(tutor);
  }

  async handleClassCategoryCreated(
    classCategoryId: string,
    level: LevelDto,
    subject: SubjectDto
  ) {
    // Create a new ClassCategory instance
    const newClassCategory = this.classCategoryRepository.create({
      id: classCategoryId,
      level,
      subject,
    });

    // Save the new ClassCategory to the database
    await this.classCategoryRepository.save(newClassCategory);
  }

  async updateTutor(id: string, updatedFields: Partial<Tutor>) {
    return this.tutorRepository.updateTutorById(id, updatedFields);
  }

  async getTutorsAndTotalCount(filters: TutorQueryDto) {
    // If classCategoryIds not specified
    if (!filters.classCategoryIds && filters?.userMakeRequest?.userId) {
      const userPreferencesData =
        await this.fetchClassCategoryPreferences(filters.userMakeRequest.userId);
      filters.classCategoryPreferences = {
        classCategoryIds: userPreferencesData?.preferences?.classCategoryIds
      };
    }
    return this.tutorRepository.getTutorsAndTotalCount(filters);
  }

  async getTutorById(id: string) {
    return this.tutorRepository.getFullTutorById(id);
  }

  async handleFeedbackCreated(tutorId: string, rate: number) {
    await this.tutorRepository.update(tutorId, {
      feedbackCount: () => "feedbackCount + 1",
      totalFeedbackRating: () => "totalFeedbackRating + " + rate,
    });
  }

  async handleClassApplicationUpdated(tutorId: string) {
    await this.tutorRepository.update(tutorId, {
      numOfClasses: () => "numOfClasses + 1",
    });
  }

  private async fetchClassCategoryPreferences(userId: string): Promise<UserPreferences> {
    try {
      return await firstValueFrom(
        this.userPreferencesClient.send<UserPreferences>({ cmd: 'getUserPreferencesByUserId' }, userId)
          .pipe(timeout(1000))
      );
    } catch (error) {
      console.error("Error fetching user's category preferences:", error);
      return await Promise.resolve(null);
    }
  }
}
