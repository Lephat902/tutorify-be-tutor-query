import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { TutorQueryService } from '../tutor-query.service';
import { TutorQueryDto } from '../dtos';

@Controller()
export class TutorQueryController {
    constructor(
        private readonly tutorQueryService: TutorQueryService,
    ) { }

    @MessagePattern({ cmd: 'getTutors'})
    async getTutors(filters: TutorQueryDto) {
        return this.tutorQueryService.getTutors(filters);
    }
}
