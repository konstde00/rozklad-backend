import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectDto } from './dto/subject.dto';

@Controller('v1/subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  async findAll(): Promise<SubjectDto[]> {
    return this.subjectsService.findAll();
  }

  @Post()
  async create(@Body() createSubjectDto: CreateSubjectDto): Promise<SubjectDto> {
    return this.subjectsService.create(createSubjectDto);
  }

  @Get(':subjectId')
  async findOne(@Param('subjectId') id: string): Promise<SubjectDto> {
    return this.subjectsService.findOne(id);
  }

  @Put(':subjectId')
  async update(
    @Param('subjectId') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ): Promise<SubjectDto> {
    return this.subjectsService.update(id, updateSubjectDto);
  }

  @Delete(':subjectId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('subjectId') id: string): Promise<void> {
    return this.subjectsService.remove(id);
  }
}
