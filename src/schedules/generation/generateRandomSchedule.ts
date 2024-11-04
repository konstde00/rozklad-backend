import {
  events_day_of_week,
} from '@prisma/client';
import { TIME_SLOTS } from '../timeSlots';
import { WeeklyEvent, WeeklySchedule } from './types';

export function generateRandomWeeklySchedule(data): WeeklySchedule {
  const events: WeeklyEvent[] = [];

  data.studentGroups.forEach((group) => {
    const groupSubjects = data.groupSubjects.filter(
      (gs) => gs.group_id === group.id
    );

    groupSubjects.forEach((gs) => {
      const subject = data.subjects.find((s) => s.id === gs.subject_id);

      if (!subject) return;

      // Find eligible teachers for the subject
      const eligibleTeachers = data.teacherSubjects.filter(
        (ts) => ts.subject_id === subject.id
      );
      if (eligibleTeachers.length === 0) return;

      const teacher =
        eligibleTeachers[Math.floor(Math.random() * eligibleTeachers.length)];

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
        teacherId: teacher.teacher_id,
        subjectId: subject.id,
        classroomId: classroom.id,
      };

      events.push(event);
    });
  });

  return { events };
}
