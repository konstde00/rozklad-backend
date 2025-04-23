import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherPreferenceDto } from './dto/create-teacher-preference.dto';
import { UpdateTeacherPreferenceDto } from './dto/update-teacher-preference.dto';

@Injectable()
export class TeacherPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTeacherPreferenceDto) {

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: data.teacher_id },
    });
    if (!teacher) {
      throw new NotFoundException(`Teacher with id ${data.teacher_id} not found`);
    }

    return this.prisma.teacherPreference.create({
      data,
    });
  }

  async findAllByTeacher(teacherId: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        teacherPreferences: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with id ${teacherId} not found`);
    }

    return teacher.teacherPreferences;
  }

  async findOne(id: number) {
    const preference = await this.prisma.teacherPreference.findUnique({
      where: { id },
    });
    if (!preference) {
      throw new NotFoundException(`Preference with id ${id} not found`);
    }
    return preference;
  }

  async update(id: number, data: UpdateTeacherPreferenceDto) {
    // Make sure it exists
    const existing = await this.prisma.teacherPreference.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Preference with id ${id} not found`);
    }

    return this.prisma.teacherPreference.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    // Make sure it exists
    const existing = await this.prisma.teacherPreference.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Preference with id ${id} not found`);
    }

    return this.prisma.teacherPreference.delete({
      where: { id },
    });
  }
}
