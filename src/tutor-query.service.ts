import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClassCategory, Tutor } from './entities';
import { Repository } from 'typeorm';
import { LevelDto, QueueNames, SubjectDto } from '@tutorify/shared';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { TutorQueryDto } from './dtos';
import { TutorRepository } from './tutor.repository';

@Injectable()
export class TutorQueryService {
  constructor(
    private readonly tutorRepository: TutorRepository,
    @InjectRepository(ClassCategory)
    private readonly classCategoryRepository: Repository<ClassCategory>,
    @Inject(QueueNames.AUTH)
    private readonly client: ClientProxy,
  ) { }

  async handleTutorCreated(tutorId: string) {
    // Event payload contains just a small amount of data
    // So that it's neccessary to fetch the full data from auth service
    const fullTutorData = await firstValueFrom(this.client.send<Tutor>({ cmd: 'getUserById' }, tutorId));
    await this.tutorRepository.save(fullTutorData);
  }

  async handleTutorProficiencyCreated(tutorId: string, classCategoryId: string) {
    // Fetch tutor along with proficiencies from database
    const tutor = await this.tutorRepository.findOne({
      where: { id: tutorId },
      relations: { proficiencies: true },
    });

    // Add class category to tutor's proficiencies
    tutor.proficiencies.push({
      id: classCategoryId
    } as ClassCategory);

    // Save updated tutor
    await this.tutorRepository.save(tutor);
  }


  async handleTutorProficiencyDeleted(tutorId: string, classCategoryId: string) {
    // Fetch tutor along with proficiencies from database
    const tutor = await this.tutorRepository.findOne({
      where: { id: tutorId },
      relations: { proficiencies: true },
    });

    // Remove class category from tutor's proficiencies
    tutor.proficiencies = tutor.proficiencies.filter(category => category.id !== classCategoryId);

    // Save updated tutor
    await this.tutorRepository.save(tutor);
  }

  async handleClassCategoryCreated(classCategoryId: string, level: LevelDto, subject: SubjectDto) {
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
    return this.tutorRepository.findByFieldsWithFilters({}, filters);
  }

  async getTutorById(id: string) {
    return this.tutorRepository.getFullTutorById(id);
  }
}