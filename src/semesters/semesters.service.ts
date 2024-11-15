
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';

@Injectable()
export class SemestersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new semester
   * @param createSemesterDto - Data to create a semester
   * @returns The created semester
   */
  async create(createSemesterDto: CreateSemesterDto) {
    const semester = await this.prisma.semester.create({
      data: {
        title: createSemesterDto.title,
        start_date: new Date(createSemesterDto.start_date),
        end_date: new Date(createSemesterDto.end_date),
      },
    });
    return this.transformSemester(semester);
  }

  /**
   * Retrieve all semesters
   * @returns An array of semesters
   */
  async findAll() {
    const semesters = await this.prisma.semester.findMany({
      include: {
        schedules: true, // Include related schedules if needed
      },
    });
    return semesters.map(this.transformSemester);
  }

  /**
   * Retrieve a single semester by ID
   * @param id - ID of the semester
   * @returns The semester with the given ID
   */
  async findOne(id: bigint) {
    const semester = await this.prisma.semester.findUnique({
      where: { id },
      include: {
        schedules: true,
      },
    });
    if (!semester) {
      throw new NotFoundException(`Semester with ID ${id} not found`);
    }
    return this.transformSemester(semester);
  }

  /**
   * Update a semester by ID
   * @param id - ID of the semester to update
   * @param updateSemesterDto - Data to update the semester
   * @returns The updated semester
   */
  async update(id: bigint, updateSemesterDto: UpdateSemesterDto) {
    await this.findOne(id); // Ensure the semester exists

    const updatedSemester = await this.prisma.semester.update({
      where: { id },
      data: {
        title: updateSemesterDto.title,
        start_date: updateSemesterDto.start_date
          ? new Date(updateSemesterDto.start_date)
          : undefined,
        end_date: updateSemesterDto.end_date
          ? new Date(updateSemesterDto.end_date)
          : undefined,
      },
    });

    return this.transformSemester(updatedSemester);
  }

  /**
   * Delete a semester by ID
   * @param id - ID of the semester to delete
   * @returns The deleted semester
   */
  async remove(id: bigint) {
    await this.findOne(id); // Ensure the semester exists

    const deletedSemester = await this.prisma.semester.delete({
      where: { id },
    });

    return this.transformSemester(deletedSemester);
  }

  /**
   * Helper method to transform semester data if needed
   * @param semester - The semester object from Prisma
   * @returns Transformed semester object
   */
  private transformSemester(semester: any) {
    return {
      ...semester,
      id: semester.id.toString(), // Convert BigInt to string for JSON serialization
    };
  }
}
