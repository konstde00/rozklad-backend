import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getInitialData() {
  const semesters = await prisma.semesters.findMany();
  const studentGroups = await prisma.student_groups.findMany();
  const subjects = await prisma.subjects.findMany();
  const teachers = await prisma.teachers.findMany();
  const classrooms = await prisma.classroom.findMany();
  const teacherSubjects = await prisma.teacher_subjects.findMany();
  const groupSubjects = await prisma.group_subjects.findMany();

  return {
    semesters,
    studentGroups,
    subjects,
    teachers,
    classrooms,
    teacherSubjects,
    groupSubjects,
  };
}

export type DataService = Awaited<ReturnType<typeof getInitialData>>;
