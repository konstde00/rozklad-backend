// teachers.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('v1/teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  async findAll() {
    return this.teachersService.findAll();
  }

  @Post()
  async create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teachersService.create(createTeacherDto);
  }

  @Get(':teacherId')
  async findOne(@Param('teacherId') teacherId: string) {
    return this.teachersService.findOne(+teacherId);
  }

  @Put(':teacherId')
  async update(
    @Param('teacherId') teacherId: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ) {
    return this.teachersService.update(+teacherId, updateTeacherDto);
  }

  @Delete(':teacherId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('teacherId') teacherId: string) {
    await this.teachersService.remove(+teacherId);
  }
}
