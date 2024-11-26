
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectDto } from './dto/subject.dto';
import { Prisma, UserRole } from '@prisma/client';
import crypto from 'crypto';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all subjects from the database.
   * @returns An array of SubjectDto.
   */
  async findAll(): Promise<SubjectDto[]> {
    const subjects = await this.prisma.subject.findMany();
    return subjects.map((subject) => this.toSubjectDto(subject));
  }

  /**
   * Retrieves a single subject by its ID.
   * @param id - The ID of the subject.
   * @returns A SubjectDto object.
   * @throws NotFoundException if the subject does not exist.
   */
  async findOne(id: string): Promise<SubjectDto> {
    const subject = await this.prisma.subject.findUnique({
      where: { id: BigInt(id) },
    });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    return this.toSubjectDto(subject);
  }

  /**
   * Creates a new subject.
   * @param createSubjectDto - Data Transfer Object containing subject details.
   * @returns The created SubjectDto.
   */
  async create(createSubjectDto: CreateSubjectDto): Promise<SubjectDto> {
    const data: Prisma.SubjectCreateInput = {
      name: createSubjectDto.name,
    };

    const subject = await this.prisma.subject.create({ data });
    return this.toSubjectDto(subject);
  }

  /**
   * Updates an existing subject.
   * @param id - The ID of the subject to update.
   * @param updateSubjectDto - Data Transfer Object containing updated subject details.
   * @returns The updated SubjectDto.
   * @throws NotFoundException if the subject does not exist.
   */
  async update(id: string, updateSubjectDto: UpdateSubjectDto): Promise<SubjectDto> {
    const subjectExists = await this.prisma.subject.findUnique({
      where: { id: BigInt(id) },
    });
    if (!subjectExists) {
      throw new NotFoundException('Subject not found');
    }

    const data: Prisma.SubjectUpdateInput = {
      name: updateSubjectDto.name,
    };

    const subject = await this.prisma.subject.update({
      where: { id: BigInt(id) },
      data,
    });
    return this.toSubjectDto(subject);
  }

  /**
   * Removes a subject from the database.
   * @param id - The ID of the subject to remove.
   * @returns Void.
   * @throws NotFoundException if the subject does not exist.
   */
  async remove(id: string): Promise<void> {
    const subjectExists = await this.prisma.subject.findUnique({
      where: { id: BigInt(id) },
    });
    if (!subjectExists) {
      throw new NotFoundException('Subject not found');
    }
    await this.prisma.subject.delete({
      where: { id: BigInt(id) },
    });
  }

  /**
   * Maps a Prisma Subject model to a SubjectDto.
   * @param subject - The Prisma Subject model.
   * @returns A SubjectDto object.
   */
  private toSubjectDto(subject: any): SubjectDto {
    return {
      id: subject.id.toString(),
      name: subject.name,
    };
  }

  async importFromJson(data: any[]) {
    const results = [];

    for (const entry of data) {
      const { subject: subject, ...rest } = entry;

      // Перевіряємо, чи користувач із таким ім'ям вже існує
      let existingSubject = await this.prisma.subject.findFirst({
        where: { name: subject },
      });

      let subjectId;
      if (!existingSubject) {

        const newSubject = await this.prisma.subject.create({
          data: {
            name: subject
          },
        });

        subjectId = newSubject.id;
      } else {
        subjectId = existingSubject.id;
      }

      entry.subjectId = subjectId;
    }

    return results;
  }
}
