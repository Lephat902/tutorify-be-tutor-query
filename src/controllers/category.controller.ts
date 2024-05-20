import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ClassCategoryQueryDto } from 'src/dtos';
import { ClassCategoryService } from 'src/services';

@Controller()
export class ClassCategoryController {
  constructor(private readonly classCategoryService: ClassCategoryService) {}

  @MessagePattern({ cmd: 'get_all_categories' })
  getAll(filters: ClassCategoryQueryDto) {
    return this.classCategoryService.findAll(filters);
  }
}
