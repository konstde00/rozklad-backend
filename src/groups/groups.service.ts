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
    const groups = await this.prisma.student_groups.findMany({
      include: {
        group_subjects: {
          include: {
            subjects: true,
          },
        },
      },
    });
    return groups.map((group) => this.toGroupDto(group));
  }

  async findOne(id: string): Promise<GroupDto> {
    const group = await this.prisma.student_groups.findUnique({
      where: { id: BigInt(id) },
      include: {
        group_subjects: {
          include: {
            subjects: true,
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
    const data: Prisma.student_groupsCreateInput = {
      name: createGroupDto.name,
      study_year: createGroupDto.study_year,
      students_count: createGroupDto.students_count,
      group_subjects: {
        create: createGroupDto.subjects.map((subject) => ({
          subjects: {
            connect: { id: BigInt(subject.id) },
          },
        })),
      },
    };
    const group = await this.prisma.student_groups.create({
      data,
      include: {
        group_subjects: {
          include: {
            subjects: true,
          },
        },
      },
    });
    return this.toGroupDto(group);
  }

  async update(id: string, updateGroupDto: UpdateGroupDto): Promise<GroupDto> {
    const groupExists = await this.prisma.student_groups.findUnique({
      where: { id: BigInt(id) },
    });
    if (!groupExists) {
      throw new NotFoundException('Group not found');
    }

    const data: Prisma.student_groupsUpdateInput = {
      name: updateGroupDto.name,
      students_count: updateGroupDto.students_count,
      group_subjects: {
        deleteMany: {},
        create: updateGroupDto.subjects?.map((subject) => ({
          subjects: {
            connect: { id: BigInt(subject.id) },
          },
        })),
      },
    };

    const group = await this.prisma.student_groups.update({
      where: { id: BigInt(id) },
      data,
      include: {
        group_subjects: {
          include: {
            subjects: true,
          },
        },
      },
    });
    return this.toGroupDto(group);
  }

  async remove(id: string): Promise<void> {
    const groupExists = await this.prisma.student_groups.findUnique({
      where: { id: BigInt(id) },
    });
    if (!groupExists) {
      throw new NotFoundException('Group not found');
    }
    await this.prisma.student_groups.delete({
      where: { id: BigInt(id) },
    });
  }

  private toGroupDto(group: any): GroupDto {
    return {
      id: group.id.toString(),
      name: group.name,
      students_count: group.students_count,
      subjects: group.group_subjects.map((gs) => ({
        id: gs.subjects.id.toString(),
        name: gs.subjects.name,
        hoursPerWeek: gs.subjects.hours_per_semester,
      })),
    };
  }
}
