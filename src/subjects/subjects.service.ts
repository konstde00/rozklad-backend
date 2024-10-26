
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectDto } from './dto/subject.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<SubjectDto[]> {
    const subjects = await this.prisma.subjects.findMany();
    return subjects.map((subject) => this.toSubjectDto(subject));
  }

  async findOne(id: string): Promise<SubjectDto> {
    const subject = await this.prisma.subjects.findUnique({
      where: { id: BigInt(id) },
    });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    return this.toSubjectDto(subject);
  }

  async create(createSubjectDto: CreateSubjectDto): Promise<SubjectDto> {
    const data: Prisma.subjectsCreateInput = {
      name: createSubjectDto.name,
      hours_per_semester: createSubjectDto.hoursPerWeek,
    };

    const subject = await this.prisma.subjects.create({ data });
    return this.toSubjectDto(subject);
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto): Promise<SubjectDto> {
    const subjectExists = await this.prisma.subjects.findUnique({
      where: { id: BigInt(id) },
    });
    if (!subjectExists) {
      throw new NotFoundException('Subject not found');
    }

    const data: Prisma.subjectsUpdateInput = {
      name: updateSubjectDto.name,
      hours_per_semester: updateSubjectDto.hoursPerWeek,
    };

    const subject = await this.prisma.subjects.update({
      where: { id: BigInt(id) },
      data,
    });
    return this.toSubjectDto(subject);
  }

  async remove(id: string): Promise<void> {
    const subjectExists = await this.prisma.subjects.findUnique({
      where: { id: BigInt(id) },
    });
    if (!subjectExists) {
      throw new NotFoundException('Subject not found');
    }
    await this.prisma.subjects.delete({
      where: { id: BigInt(id) },
    });
  }

  private toSubjectDto(subject: any): SubjectDto {
    return {
      id: subject.id.toString(),
      name: subject.name,
      hoursPerWeek: subject.hours_per_semester,
    };
  }
}
