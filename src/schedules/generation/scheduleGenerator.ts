// generateRandomSchedule.ts

import { WeeklySchedule, WeeklyEvent } from './types'; // Assuming you have a types file
import { events_day_of_week } from '@prisma/client';
import { TIME_SLOTS } from '../timeSlots';
import { DataService } from '../interfaces';

export function generateRandomWeeklySchedule(data: DataService): WeeklySchedule {
  const events: WeeklyEvent[] = [];

  // Calculate the number of weeks in the semester
  const semesterWeeks = calculateSemesterWeeks(
    data.semesters[0].start_date,
    data.semesters[0].end_date
  );

  data.studentGroups.forEach((group) => {
    const groupSubjects = data.groupSubjects.filter(
      (gs) => gs.group_id === group.id
    );

    groupSubjects.forEach((gs) => {
      const subject = data.subjects.find((s) => s.id === gs.subject_id);

      if (!subject) return;

      // Calculate lessons per week for the subject
      const totalHours = subject.hours_per_semester;
      const lessonDuration = 0.75; // Assuming each lesson is 45 minutes (0.75 hours)
      const totalLessons = totalHours / lessonDuration;
      const lessonsPerWeek = Math.ceil(totalLessons / semesterWeeks);

      for (let i = 0; i < lessonsPerWeek; i++) {
        // Find eligible teachers
        const eligibleTeachers = data.teacherSubjects.filter(
          (ts) => ts.subject_id === subject.id
        );
        if (eligibleTeachers.length === 0) continue;

        const teacherSubject =
          eligibleTeachers[Math.floor(Math.random() * eligibleTeachers.length)];
        const teacher = data.teachers.find(
          (t) => t.id === teacherSubject.teacher_id
        );
        if (!teacher) continue;

        // Random classroom
        const classroom =
          data.classrooms[Math.floor(Math.random() * data.classrooms.length)];

        // Random day_of_week
        const daysOfWeek = Object.values(events_day_of_week).filter(
          (value) => typeof value === 'string'
        ) as events_day_of_week[];
        const day_of_week =
          daysOfWeek[Math.floor(Math.random() * daysOfWeek.length)];

        // Random time slot index
        const timeSlotIndex = Math.floor(Math.random() * TIME_SLOTS.length);

        // Create a weekly event
        const event: WeeklyEvent = {
          title: subject.name,
          dayOfWeek: day_of_week,
          timeSlot: timeSlotIndex,
          groupId: group.id,
          teacherId: teacher.id,
          subjectId: subject.id,
          classroomId: classroom.id,
        };

        events.push(event);
      }
    });
  });

  return { events };
}

// Helper function to calculate the number of weeks in the semester
function calculateSemesterWeeks(startDate: Date, endDate: Date): number {
  const msInWeek = 7 * 24 * 60 * 60 * 1000;
  const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / msInWeek);
  return weeks;
}
