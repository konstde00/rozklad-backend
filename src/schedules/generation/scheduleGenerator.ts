
import {
  schedules as PrismaSchedule,
  events as PrismaEvent,
  events_day_of_week,
} from '@prisma/client';
import { TIME_SLOTS } from '../timeSlots';

type ScheduleWithEvents = PrismaSchedule & {
  events: PrismaEvent[];
  fitness?: number;
};

export function generateRandomSchedule(
  data,
  semesterId: bigint
): ScheduleWithEvents {
  // Retrieve the semester data
  const semester = data.semesters.find((s) => s.id === semesterId);
  if (!semester) {
    throw new Error(`Semester with ID ${semesterId} not found.`);
  }

  const startDate = new Date(semester.start_date);
  const endDate = new Date(semester.end_date);

  // Create a new schedule
  const schedule: PrismaSchedule = {
    id: BigInt(0), // Or generate a unique ID if necessary
    name: 'Generated Schedule',
    semester_id: semester.id,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const events: PrismaEvent[] = [];

  // Define working days (Monday to Friday)
  const workingDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ] as events_day_of_week[];

  // For each student group, assign subjects, teachers, classrooms, and time slots
  data.studentGroups.forEach((group) => {
    const groupSubjects = data.groupSubjects.filter(
      (gs) => gs.group_id === group.id
    );

    groupSubjects.forEach((gs) => {
      const subject = data.subjects.find((s) => s.id === gs.subject_id);

      // Ensure subject exists
      if (!subject) {
        console.warn(`Subject with ID ${gs.subject_id} not found.`);
        return;
      }

      // Find eligible teachers for the subject
      const eligibleTeachers = data.teacherSubjects.filter(
        (ts) => ts.subject_id === subject.id
      );
      if (eligibleTeachers.length === 0) {
        console.warn(
          `No eligible teachers found for subject ID ${subject.id}.`
        );
        return;
      }
      const teacher =
        eligibleTeachers[Math.floor(Math.random() * eligibleTeachers.length)];

      // Random classroom
      if (data.classrooms.length === 0) {
        throw new Error('No classrooms available.');
      }
      const classroom =
        data.classrooms[Math.floor(Math.random() * data.classrooms.length)];

      // Determine the number of sessions per week
      const totalWeeks = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      const sessionsPerWeek = Math.ceil(
        subject.hours_per_semester / totalWeeks
      );

      // Assign consistent days and time slots for the sessions
      const availableDays = workingDays.slice(); // Copy of working days
      const availableTimeSlots = TIME_SLOTS.slice(); // Copy of time slots
      const sessionDays: events_day_of_week[] = [];
      const sessionTimeSlots: { start: string; end: string }[] = [];

      for (let i = 0; i < sessionsPerWeek; i++) {
        // Select a random day from available days
        if (availableDays.length === 0) {
          throw new Error('Not enough days in the week to schedule sessions.');
        }
        const dayIndex = Math.floor(Math.random() * availableDays.length);
        const day_of_week = availableDays.splice(dayIndex, 1)[0];
        sessionDays.push(day_of_week);

        // Select a random time slot
        if (availableTimeSlots.length === 0) {
          throw new Error('No time slots available.');
        }
        const timeSlotIndex = Math.floor(
          Math.random() * availableTimeSlots.length
        );
        const timeSlot = availableTimeSlots.splice(timeSlotIndex, 1)[0];
        sessionTimeSlots.push(timeSlot);
      }

      // For each session day, generate events throughout the semester
      for (let i = 0; i < sessionDays.length; i++) {
        const day_of_week = sessionDays[i];
        const timeSlot = sessionTimeSlots[i];
        const eventDates = getDatesForDayOfWeekBetween(
          startDate,
          endDate,
          day_of_week
        );

        eventDates.forEach((eventDate) => {
          const startTime = setTimeToDate(eventDate, timeSlot.start);
          const endTime = setTimeToDate(eventDate, timeSlot.end);

          // Create an event
          const event: PrismaEvent = {
            id: BigInt(0), // Or generate a unique ID
            title: subject.name,
            description: null,
            day_of_week: day_of_week,
            start_time: startTime,
            end_time: endTime,
            schedule_id: schedule.id,
            group_id: group.id,
            created_at: new Date(),
            updated_at: new Date(),
          };

          events.push(event);
        });
      }
    });
  });

  // Return the schedule with events
  return { ...schedule, events };
}

// Helper functions
function getDatesForDayOfWeekBetween(
  startDate: Date,
  endDate: Date,
  dayOfWeek: events_day_of_week
): Date[] {
  const dates: Date[] = [];
  const dayOfWeekIndex = dayOfWeekToIndex(dayOfWeek);

  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  // Move to the first occurrence of the specified day_of_week
  while (currentDate.getDay() !== dayOfWeekIndex) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Iterate through the dates, adding 7 days each time
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return dates;
}

function dayOfWeekToIndex(dayOfWeek: events_day_of_week): number {
  // JavaScript getDay(): Sunday - 0, Monday - 1, ..., Saturday - 6
  switch (dayOfWeek) {
    case 'Sunday':
      return 0;
    case 'Monday':
      return 1;
    case 'Tuesday':
      return 2;
    case 'Wednesday':
      return 3;
    case 'Thursday':
      return 4;
    case 'Friday':
      return 5;
    case 'Saturday':
      return 6;
    default:
      throw new Error(`Invalid day of week: ${dayOfWeek}`);
  }
}

function setTimeToDate(date: Date, timeStr: string): Date {
  const [hoursStr, minutesStr] = timeStr.split(':');
  const newDate = new Date(date);
  newDate.setHours(parseInt(hoursStr, 10), parseInt(minutesStr, 10), 0, 0);
  return newDate;
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = array.slice();
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
