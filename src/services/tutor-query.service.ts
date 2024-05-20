import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ClassCategory, Tutor } from "../entities";
import { Repository } from "typeorm";
import {
  AddressProxy,
  AuthProxy,
  GeocodeResponseDto,
  LevelDto,
  SubjectDto,
  UserPreferencesProxy
} from "@tutorify/shared";
import { TutorQueryDto } from "../dtos";
import { TutorRepository } from "../repositories/tutor.repository";

@Injectable()
export class TutorQueryService {
  constructor(
    private readonly tutorRepository: TutorRepository,
    @InjectRepository(ClassCategory)
    private readonly classCategoryRepository: Repository<ClassCategory>,
    private readonly authProxy: AuthProxy,
    private readonly userPreferencesProxy: UserPreferencesProxy,
    private readonly addressProxy: AddressProxy,
  ) { }

  async handleTutorCreatedOrUpdated(tutorId: string) {
    // Event payload contains just a small amount of data
    // So that it's neccessary to fetch the full data from auth service
    const fullTutorData = await this.authProxy.getUserById(tutorId);
    await this.tutorRepository.save(fullTutorData);
  }

  async handleTutorDeleted(tutorId: string) {
    const tutor = await this.tutorRepository.findOne({
      where: { id: tutorId },
      relations: ["proficiencies"]
    });

    if (!tutor) {
      throw new Error("Tutor not found");
    }

    // Remove the relations
    tutor.proficiencies = [];
    await this.tutorRepository.save(tutor);

    // Delete the tutor
    await this.tutorRepository.remove(tutor);
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
    slug: string,
    level: LevelDto,
    subject: SubjectDto
  ) {
    // Create a new ClassCategory instance
    const newClassCategory = this.classCategoryRepository.create({
      id: classCategoryId,
      slug,
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
    await Promise.allSettled([
      this.setUserPreferences(filters),
      this.setLocation(filters),
    ]);
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

  async handleFeedbackDeleted(tutorId: string, rate: number) {
    await this.tutorRepository.update(tutorId, {
      feedbackCount: () => "feedbackCount - 1",
      totalFeedbackRating: () => "totalFeedbackRating - " + rate,
    });
  }

  async handleClassApplicationUpdated(tutorId: string) {
    await this.tutorRepository.update(tutorId, {
      numOfClasses: () => "numOfClasses + 1",
    });
  }

  private async setUserPreferences(filters: TutorQueryDto) {
    // If classCategoryIds not specified
    if (!filters.classCategoryIds && filters?.userMakeRequest?.userId) {
      const userPreferencesData =
        await this.userPreferencesProxy.getUserPreferencesByUserId(filters.userMakeRequest.userId, 1000);
      filters.userPreferences = userPreferencesData?.preferences;
    }
  }

  private async setLocation(filters: TutorQueryDto) {
    let res: GeocodeResponseDto;
    if (filters.wardId) {
      res = await this.addressProxy.getGeocodeFromWardId(filters.wardId);
    } else if (filters.wardSlug) {
      res = await this.addressProxy.getGeocodeFromWardSlug(filters.wardSlug);
    } else if (filters.districtId) {
      res = await this.addressProxy.getGeocodeFromDistrictId(filters.districtId);
    } else if (filters.districtSlug) {
      res = await this.addressProxy.getGeocodeFromDistrictSlug(filters.districtSlug);
    } else if (filters.provinceId) {
      res = await this.addressProxy.getGeocodeFromProvinceId(filters.provinceId);
    } else if (filters.provinceSlug) {
      res = await this.addressProxy.getGeocodeFromProvinceSlug(filters.provinceSlug);
    }

    if (res) {
      filters.location = {
        type: 'Point',
        coordinates: [res.lon, res.lat],
      };
    }
  }
}
