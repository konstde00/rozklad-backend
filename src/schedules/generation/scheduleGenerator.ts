
import { WeeklyEvent, WeeklySchedule } from './types';
import { events_day_of_week, lesson_type } from '@prisma/client';
import { TIME_SLOTS } from '../timeSlots';
import { DataService } from '../interfaces';

export function generateRandomWeeklySchedule(
  data: DataService,
): WeeklySchedule {
  const events: WeeklyEvent[] = [];
  const scheduleMap = createScheduleMap();

  // Calculate the number of weeks in the semester
  const semesterWeeks = calculateSemesterWeeks(
    data.semesters[0].start_date,
    data.semesters[0].end_date,
  );

  data.studentGroups.forEach((group) => {
    const groupSubjects = data.groupSubjects.filter(
      (gs) => gs.group_id === group.id,
    );

    groupSubjects.forEach((gs) => {
      const subject = data.subjects.find((s) => s.id === gs.subject_id);

      if (!subject) return;

      const lessonTypes: lesson_type[] = ['lecture', 'practice'];

      lessonTypes.forEach((lt) => {
        let requiredHours = 0;
        if (lt === 'lecture') {
          requiredHours = subject.lecture_hours_per_semester;
        } else if (lt === 'practice') {
          requiredHours = subject.practice_hours_per_semester;
        }

        if (requiredHours === 0) return;

        const totalLessons = requiredHours; // Each lesson is 1 hour long
        const lessonsPerWeek = Math.ceil(totalLessons / semesterWeeks);

        for (let i = 0; i < lessonsPerWeek; i++) {
          // Find eligible teachers
          const eligibleTeachers = data.teacherSubjects.filter(
            (ts) =>
              ts.subject_id === subject.id &&
              ts.lesson_type === lt
          );

          if (eligibleTeachers.length === 0) continue;

          const teacherSubject =
            eligibleTeachers[Math.floor(Math.random() * eligibleTeachers.length)];
          const teacher = data.teachers.find(
            (t) => t.id === teacherSubject.teacher_id,
          );
          if (!teacher) continue;

          // Random classroom that fits the group size
          const suitableClassrooms = data.classrooms.filter(
            (c) => c.capacity >= group.students_count,
          );
          if (suitableClassrooms.length === 0) continue;
          const classroom =
            suitableClassrooms[
              Math.floor(Math.random() * suitableClassrooms.length)
              ];

          // Random day_of_week and time slot
          const daysOfWeek = Object.values(events_day_of_week).filter(
            (value) => typeof value === 'string',
          ) as events_day_of_week[];
          const day_of_week =
            daysOfWeek[Math.floor(Math.random() * daysOfWeek.length)];

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
            lessonType: lt,
          };

          // Check for conflicts
          if (hasConflict(event, scheduleMap)) {
            // Try to find an alternative time slot
            const alternativeEvent = findAlternativeEvent(event, scheduleMap);
            if (alternativeEvent) {
              events.push(alternativeEvent);
              updateScheduleMap(alternativeEvent, scheduleMap);
            }
          } else {
            events.push(event);
            updateScheduleMap(event, scheduleMap);
          }
        }
      });
    });
  });

  return { events };
}

// Helper function to create a schedule map
function createScheduleMap() {
  return {
    teacherSchedule: new Map<string, boolean>(),
    groupSchedule: new Map<string, boolean>(),
    classroomSchedule: new Map<string, boolean>(),
  };
}

// Helper function to check for conflicts
function hasConflict(event: WeeklyEvent, scheduleMap): boolean {
  const key = `${event.dayOfWeek}-${event.timeSlot}`;
  const teacherKey = `${event.teacherId}-${key}`;
  const groupKey = `${event.groupId}-${key}`;
  const classroomKey = `${event.classroomId}-${key}`;

  return (
    scheduleMap.teacherSchedule.has(teacherKey) ||
    scheduleMap.groupSchedule.has(groupKey) ||
    scheduleMap.classroomSchedule.has(classroomKey)
  );
}

// Helper function to update the schedule map
function updateScheduleMap(event: WeeklyEvent, scheduleMap) {
  const key = `${event.dayOfWeek}-${event.timeSlot}`;
  scheduleMap.teacherSchedule.set(`${event.teacherId}-${key}`, true);
  scheduleMap.groupSchedule.set(`${event.groupId}-${key}`, true);
  scheduleMap.classroomSchedule.set(`${event.classroomId}-${key}`, true);
}

// Helper function to calculate the number of weeks in the semester
export function calculateSemesterWeeks(startDate: Date, endDate: Date): number {
  const msInWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.ceil((endDate.getTime() - startDate.getTime()) / msInWeek);
}

// Helper function to find an alternative event time
function findAlternativeEvent(
  event: WeeklyEvent,
  scheduleMap
): WeeklyEvent | null {
  const daysOfWeek = Object.values(events_day_of_week).filter(
    (value) => typeof value === 'string'
  ) as events_day_of_week[];

  for (const dayOfWeek of daysOfWeek) {
    for (let timeSlotIndex = 0; timeSlotIndex < TIME_SLOTS.length; timeSlotIndex++) {
      const alternativeEvent = { ...event, dayOfWeek, timeSlot: timeSlotIndex };
      if (!hasConflict(alternativeEvent, scheduleMap)) {
        return alternativeEvent;
      }
    }
  }
  return null; // No alternative found
}
