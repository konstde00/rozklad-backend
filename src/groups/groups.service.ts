
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Prisma } from '@prisma/client';
import { GroupDto } from './dto/group.dto';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<GroupDto[]> {
    const groups = await this.prisma.studentGroup.findMany({
      include: {
        teachingAssignments: {
          include: {
            subject: true,
          },
        },
      },
    });
    return groups.map((group) => this.toGroupDto(group));
  }

  async findOne(id: string): Promise<GroupDto> {
    const group = await this.prisma.studentGroup.findUnique({
      where: { id: BigInt(id) },
      include: {
        teachingAssignments: {
          include: {
            subject: true,
          },
        },
      },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return this.toGroupDto(group);
  }

  async create(createGroupDto: CreateGroupDto): Promise<GroupDto> {
    const data: Prisma.StudentGroupCreateInput = {
      name: createGroupDto.name,
      study_year: createGroupDto.study_year,
      students_count: createGroupDto.students_count,
      course_number: createGroupDto.course_number,
    };
    const group = await this.prisma.studentGroup.create({
      data,
      include: {
        teachingAssignments: {
          include: {
            subject: true,
          },
        },
      },
    });
    return this.toGroupDto(group);
  }

  async update(id: string, updateGroupDto: UpdateGroupDto): Promise<GroupDto> {
    const groupExists = await this.prisma.studentGroup.findUnique({
      where: { id: BigInt(id) },
    });
    if (!groupExists) {
      throw new NotFoundException('Group not found');
    }

    const data: Prisma.StudentGroupUpdateInput = {
      name: updateGroupDto.name,
      study_year: updateGroupDto.study_year,
      students_count: updateGroupDto.students_count,
      course_number: updateGroupDto.course_number,
    };

    const group = await this.prisma.studentGroup.update({
      where: { id: BigInt(id) },
      data,
      include: {
        teachingAssignments: {
          include: {
            subject: true,
          },
        },
      },
    });
    return this.toGroupDto(group);
  }

  async remove(id: string): Promise<void> {
    const groupExists = await this.prisma.studentGroup.findUnique({
      where: { id: BigInt(id) },
    });
    if (!groupExists) {
      throw new NotFoundException('Group not found');
    }
    await this.prisma.studentGroup.delete({
      where: { id: BigInt(id) },
    });
  }

  private toGroupDto(group: any): GroupDto {
    const subjects = group.teachingAssignments.map((ta) => ({
      id: ta.subject.id.toString(),
      name: ta.subject.name,
    }));

    // Remove duplicate subjects
    const uniqueSubjects = Array.from(
      new Map(subjects.map((s) => [s.id, s])).values(),
    );

    return <GroupDto>{
      id: group.id.toString(),
      name: group.name,
      study_year: group.study_year,
      students_count: group.students_count,
      course_number: group.course_number,
      teachingAssignments: uniqueSubjects,
    };
  }
}
