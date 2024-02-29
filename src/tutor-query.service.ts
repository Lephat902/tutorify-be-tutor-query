import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClassCategory, Level, Subject, Tutor } from './entities';
import { Repository } from 'typeorm';
import { QueueNames } from '@tutorify/shared';
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
    @InjectRepository(Level)
    private readonly levelRepository: Repository<Level>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
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

  async handleClassCategoryCreated(classCategoryId: string, levelId: string, subjectId: string) {
    const level = await this.findOrCreateEntity({
      id: levelId,
    } as Level, this.levelRepository);

    const subject = await this.findOrCreateEntity({
      id: subjectId,
    } as Subject, this.subjectRepository);

    // Create a new ClassCategory instance
    const newClassCategory = this.classCategoryRepository.create({
      id: classCategoryId,
      subject,
      level,
    });

    // Save the new ClassCategory to the database
    await this.classCategoryRepository.save(newClassCategory);
  }

  async updateTutor(id: string, updatedFields: Partial<Tutor>) {
    return this.tutorRepository.updateTutorById(id, updatedFields);
  }

  async getTutors(filters: TutorQueryDto) {
    return this.tutorRepository.findByFieldsWithFilters({}, filters);
  }

  private async findOrCreateEntity(
    entity: Level | Subject,
    entityRepository: Repository<Level> | Repository<Subject>
  ): Promise<Level | Subject> {
    const existingEntity = await entityRepository.findOne({ where: { id: entity.id } });
    if (existingEntity) {
      return existingEntity;
    }
    return entityRepository.save(entity);
  }
}