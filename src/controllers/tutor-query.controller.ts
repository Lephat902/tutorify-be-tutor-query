import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { TutorQueryService } from '../tutor-query.service';
import { TutorQueryDto } from '../dtos';

@Controller()
export class TutorQueryController {
    constructor(
        private readonly tutorQueryService: TutorQueryService,
    ) { }

    @MessagePattern({ cmd: 'getTutorsAndTotalCount'})
    async getTutorsAndTotalCount(filters: TutorQueryDto) {
        return this.tutorQueryService.getTutorsAndTotalCount(filters);
    }

    @MessagePattern({ cmd: 'getTutorById'})
    async getTutorById(id: string) {
        return this.tutorQueryService.getTutorById(id);
    }
}
