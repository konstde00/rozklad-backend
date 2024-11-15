
import { PrismaClient } from '@prisma/client';
import { TIME_SLOTS } from './timeSlots';

const prisma = new PrismaClient();

export async function getInitialData() {
  const semesters = await prisma.semester.findMany();
  const studentGroups = await prisma.studentGroup.findMany();
  const subjects = await prisma.subject.findMany();
  const teachers = await prisma.teacher.findMany();
  const classrooms = await prisma.classroom.findMany();
  const teachingAssignments = await prisma.teachingAssignment.findMany();
  const timeSlots = TIME_SLOTS;

  return {
    semesters,
    studentGroups,
    subjects,
    teachers,
    classrooms,
    teachingAssignments,
    timeSlots,
  };
}

export type DataService = Awaited<ReturnType<typeof getInitialData>>;
