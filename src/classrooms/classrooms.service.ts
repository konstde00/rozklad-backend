// src/classrooms/classrooms.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';

@Injectable()
export class ClassroomsService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new classroom
  async create(createClassroomDto: CreateClassroomDto) {
    return this.prisma.classroom.create({
      data: createClassroomDto,
    });
  }

  // Find all classrooms
  async findAll() {
    return this.prisma.classroom.findMany();
  }

  // Find a single classroom by ID
  async findOne(id: number) {
    const classroom = await this.prisma.classroom.findUnique({
      where: { id },
    });
    if (!classroom) {
      throw new NotFoundException(`Classroom with ID ${id} not found`);
    }
    return classroom;
  }

  // Update a classroom
  async update(id: number, updateClassroomDto: UpdateClassroomDto) {
    await this.findOne(id); // Ensure the classroom exists
    return this.prisma.classroom.update({
      where: { id },
      data: updateClassroomDto,
    });
  }

  // Remove a classroom
  async remove(id: number) {
    await this.findOne(id); // Ensure the classroom exists
    return this.prisma.classroom.delete({
      where: { id },
    });
  }
}
