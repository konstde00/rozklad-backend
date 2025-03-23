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
} from '@nestjs/common';
import { TeacherPreferencesService } from './teacher-preferences.service';
import { CreateTeacherPreferenceDto } from './dto/create-teacher-preference.dto';
import { UpdateTeacherPreferenceDto } from './dto/update-teacher-preference.dto';

@Controller('v1/teacher-preferences')
export class TeacherPreferencesController {
  constructor(
    private readonly teacherPreferencesService: TeacherPreferencesService,
  ) {}

  /**
   * Create a single preference record
   * Remember that your DTO requires teacher_id in the body
   */
  @Post()
  async create(@Body() createDto: CreateTeacherPreferenceDto) {
    return this.teacherPreferencesService.create(createDto);
  }

  /**
   * Return all preference records for a specific teacher
   */
  @Get('teacher/:teacherId')
  async findAllForTeacher(@Param('teacherId') teacherId: string) {
    return this.teacherPreferencesService.findAllByTeacher(Number(teacherId));
  }

  /**
   * Return one preference by its ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.teacherPreferencesService.findOne(Number(id));
  }

  /**
   * Update an existing preference
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTeacherPreferenceDto,
  ) {
    return this.teacherPreferencesService.update(Number(id), updateDto);
  }

  /**
   * Delete an existing preference
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.teacherPreferencesService.remove(Number(id));
  }
}
