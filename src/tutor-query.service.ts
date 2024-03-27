import { Inject, Injectable, NotFoundException } from "@nestjs/common";
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

  async addTutorProficiencies(
    tutorId: string,
    classCategoryIds: string[]
  ) {
    // Fetch tutor along with proficiencies from database
    const tutor = await this.tutorRepository.findOne({
      where: { id: tutorId },
      relations: { proficiencies: true },
    });

    if (!tutor)
      throw new NotFoundException(`This user may not be a tutor`);

    const proficiencies = await this.classCategoryRepository.createQueryBuilder('classCategory')
      .where('classCategory.id IN (:...classCategoryIds)', { classCategoryIds })
      .getMany();

    tutor.proficiencies.push(...proficiencies);
    console.log("After adding class categories:", tutor.proficiencies);

    await this.tutorRepository.save(tutor);
  }

  async deleteTutorProficiencies(
    tutorId: string,
    classCategoryIdsToDelete: string[]
  ) {
    // Fetch tutor along with proficiencies from database
    const tutor = await this.tutorRepository.findOne({
      where: { id: tutorId },
      relations: { proficiencies: true },
    });

    if (!tutor)
      throw new NotFoundException(`This user may not be a tutor`);

    tutor.proficiencies = tutor.proficiencies.filter(proficiency => !classCategoryIdsToDelete.includes(proficiency.id));
    console.log("What to delete is:", classCategoryIdsToDelete);
    console.log("After deleting class categories:", tutor.proficiencies);

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
