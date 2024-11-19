// teachers.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.teacher.findMany({
      include: {
        user: true,
        teachingAssignments: true,
        events: true,
      },
    });
  }

  async create(createTeacherDto: CreateTeacherDto) {
    const {
      first_name,
      last_name,
      max_hours_per_week,
    } = createTeacherDto;

    const defaultPassword = 'temporal_default_password';
    const password_hash = crypto
      .createHash('sha256')
      .update(defaultPassword)
      .digest('hex');

    let username = first_name + '.' + last_name;
    let email = username + '@temporalmail.com';

    try {
      // Create user
      const createdUser = await this.prisma.user.create({
        data: {
          username,
          email,
          password_hash,
          role: UserRole.teacher,
        },
      });

      // Create teacher linked to the user
      return this.prisma.teacher.create({
        data: {
          id: createdUser.id,
          first_name,
          last_name,
          max_hours_per_week,
        },
        include: {
          user: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email or username already exists');
      }
      throw error;
    }
  }

  async findOne(id: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        teachingAssignments: true,
        events: true,
      },
    });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }
    return teacher;
  }

  async update(id: number, updateTeacherDto: UpdateTeacherDto) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return this.prisma.teacher.update({
      where: { id },
      data: updateTeacherDto,
      include: {
        user: true,
      },
    });
  }

  async remove(id: number) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    await this.prisma.teacher.delete({ where: { id } });
  }
}
