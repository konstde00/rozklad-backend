import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeachingAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const teachingAssignments = await this.prisma.teachingAssignment.findMany({
      include: {
        teacher: {
          select: { id: true, first_name: true, last_name: true },
        },
        studentGroup: {
          select: { id: true, name: true },
        },
        subject: {
          select: { id: true, name: true },
        },
      },
    });
    return teachingAssignments.map((ta) => this.toDto(ta));
  }

  async findOne(id: string) {
    const teachingAssignment = await this.prisma.teachingAssignment.findUnique({
      where: { id: BigInt(id) },
      include: {
        teacher: {
          select: { id: true, first_name: true, last_name: true },
        },
        studentGroup: {
          select: { id: true, name: true },
        },
        subject: {
          select: { id: true, name: true },
        },
      },
    });

    if (!teachingAssignment) {
      throw new NotFoundException('Teaching assignment not found');
    }

    return this.toDto(teachingAssignment);
  }

  async create(data: any) {
    const teachingAssignment = await this.prisma.teachingAssignment.create({
      data: {
        teacher_id: BigInt(data.teacherId),
        group_id: BigInt(data.groupId),
        subject_id: BigInt(data.subjectId),
        speciality: data.speciality,
        course_number: data.courseNumber,
        lecture_hours_per_semester: data.lectureHoursPerSemester,
        practice_hours_per_semester: data.practiceHoursPerSemester,
        lab_hours_per_semester: data.labHoursPerSemester,
        seminar_hours_per_semester: data.seminarHoursPerSemester,
      },
      include: {
        teacher: {
          select: { id: true, first_name: true, last_name: true },
        },
        studentGroup: {
          select: { id: true, name: true },
        },
        subject: {
          select: { id: true, name: true },
        },
      },
    });

    return this.toDto(teachingAssignment);
  }

  async update(id: string, data: any) {
    const teachingAssignmentExists = await this.prisma.teachingAssignment.findUnique({
      where: { id: BigInt(id) },
    });

    if (!teachingAssignmentExists) {
      throw new NotFoundException('Teaching assignment not found');
    }

    const teachingAssignment = await this.prisma.teachingAssignment.update({
      where: { id: BigInt(id) },
      data: {
        teacher_id: BigInt(data.teacherId),
        group_id: BigInt(data.groupId),
        subject_id: BigInt(data.subjectId),
        speciality: data.speciality,
        course_number: data.courseNumber,
        lecture_hours_per_semester: data.lectureHoursPerSemester,
        practice_hours_per_semester: data.practiceHoursPerSemester,
        lab_hours_per_semester: data.labHoursPerSemester,
        seminar_hours_per_semester: data.seminarHoursPerSemester,
      },
      include: {
        teacher: {
          select: { id: true, first_name: true, last_name: true },
        },
        studentGroup: {
          select: { id: true, name: true },
        },
        subject: {
          select: { id: true, name: true },
        },
      },
    });

    return this.toDto(teachingAssignment);
  }

  async remove(id: string) {
    const teachingAssignmentExists = await this.prisma.teachingAssignment.findUnique({
      where: { id: BigInt(id) },
    });

    if (!teachingAssignmentExists) {
      throw new NotFoundException('Teaching assignment not found');
    }

    await this.prisma.teachingAssignment.delete({
      where: { id: BigInt(id) },
    });
  }

  private toDto(teachingAssignment: any) {
    return {
      id: teachingAssignment.id.toString(),
      teacher: {
        id: teachingAssignment.teacher.id.toString(),
        fullName: `${teachingAssignment.teacher.first_name} ${teachingAssignment.teacher.last_name}`,
      },
      studentGroup: {
        id: teachingAssignment.studentGroup.id.toString(),
        name: teachingAssignment.studentGroup.name,
      },
      subject: {
        id: teachingAssignment.subject.id.toString(),
        name: teachingAssignment.subject.name,
      },
      speciality: teachingAssignment.speciality,
      courseNumber: teachingAssignment.course_number,
      lectureHoursPerSemester: teachingAssignment.lecture_hours_per_semester,
      practiceHoursPerSemester: teachingAssignment.practice_hours_per_semester,
      labHoursPerSemester: teachingAssignment.lab_hours_per_semester,
      seminarHoursPerSemester: teachingAssignment.seminar_hours_per_semester,
    };
  }

  async importFromJson(data: any[]) {
    const results = [];

    for (const entry of data) {

      const { teacherId, subjectId, specialityCode, courseNumber, lec, lab, sem, pract } = entry;

      await this.prisma.teachingAssignment.create({
        data: {
          teacher_id: BigInt(teacherId),
          group_id: null,
          subject_id: BigInt(subjectId),
          speciality: +specialityCode,
          course_number: +courseNumber,
          lecture_hours_per_semester: +lec,
          practice_hours_per_semester: +pract,
          lab_hours_per_semester: +lab,
          seminar_hours_per_semester: +sem
        }
      });
    }

    return results;
  }
}
