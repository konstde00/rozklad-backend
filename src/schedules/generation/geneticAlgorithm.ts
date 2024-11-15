
import { DayOfWeek, LessonType } from '@prisma/client';

import { WeeklySchedule } from './types';
import { calculateFitness } from './fitnessFunction';
import {
  calculateSemesterWeeks,
  generateRandomWeeklySchedule,
} from './scheduleGenerator';
import { DataService, GeneticAlgorithmConfig } from '../interfaces';
import { TIME_SLOTS } from '../timeSlots';
import { WeeklyEvent } from './types';

export async function runGeneticAlgorithm(
  config: GeneticAlgorithmConfig,
  data: DataService,
  semesterId: bigint,
) {
  let population: WeeklySchedule[] = [];

  let semester = data.semesters.find((s) => s.id === semesterId);
  if (!semester) {
    throw new Error('Semester not found');
  }

  const semesterWeeks = calculateSemesterWeeks(
    semester.start_date,
    semester.end_date,
  );

  while (population.length < config.populationSize) {
    const individual = generateRandomWeeklySchedule(data);
    const conflicts = checkHardConstraints(individual.events, data);
    if (conflicts.length > 0) {
      individual.events = repairSchedule(individual.events, data);
    }
    individual.fitness = calculateFitness(individual, data, semesterWeeks);
    population.push(individual);
  }

  for (let generation = 0; generation < config.generations; generation++) {
    population = selection(population);

    population = crossover(population, config.crossoverRate, data);

    population = mutation(population, config.mutationRate, data);

    population = population.map((individual) => {
      const conflicts = checkHardConstraints(individual.events, data);
      if (conflicts.length > 0) {
        individual.events = repairSchedule(individual.events, data);
      }
      return individual;
    });

    population.forEach((individual) => {
      individual.fitness = calculateFitness(individual, data, semesterWeeks);
    });

    const bestFitness = Math.max(
      ...population.map((ind) => ind.fitness ?? Number.NEGATIVE_INFINITY),
    );
    console.log(`Generation ${generation}: Best Fitness = ${bestFitness}`);
  }

  return population.reduce((prev, current) =>
    (prev.fitness ?? Number.NEGATIVE_INFINITY) > (current.fitness ?? Number.NEGATIVE_INFINITY)
      ? prev
      : current,
  );
}

// Ensure no teacher, group, or classroom is double-booked
// Ensure classroom capacity is sufficient
// Ensure teacher qualifications
// Returns an array of conflicting events, or an empty array if there are no conflicts
function checkHardConstraints(
  events: WeeklyEvent[],
  data: DataService,
): WeeklyEvent[] {
  const eventMap = new Map<string, WeeklyEvent>();
  const conflicts: WeeklyEvent[] = [];

  for (const event of events) {
    const key = `${event.dayOfWeek}-${event.timeSlot}`;

    // Check for teacher availability
    const teacherKey = `teacher-${event.teacherId}-${key}`;
    if (eventMap.has(teacherKey)) {
      conflicts.push(event);
      continue;
    }

    // Check for group availability
    const groupKey = `group-${event.groupId}-${key}`;
    if (eventMap.has(groupKey)) {
      conflicts.push(event);
      continue;
    }

    // Check for classroom availability
    const classroomKey = `classroom-${event.classroomId}-${key}`;
    if (eventMap.has(classroomKey)) {
      conflicts.push(event);
      continue;
    }

    // Check classroom capacity
    const group = data.studentGroups.find((g) => g.id === event.groupId);
    const classroom = data.classrooms.find((c) => c.id === event.classroomId);
    if (classroom && group && classroom.capacity < group.students_count) {
      conflicts.push(event);
      continue;
    }

    // Check teacher qualification using teachingAssignments
    const assignmentExists = data.teachingAssignments.some(
      (ta) =>
        ta.teacher_id === event.teacherId &&
        ta.group_id === event.groupId &&
        ta.subject_id === event.subjectId &&
        ((ta.lecture_hours_per_semester > 0 && event.lessonType === 'lecture') ||
          (ta.practice_hours_per_semester > 0 && event.lessonType === 'practice') ||
          (ta.lab_hours_per_semester > 0 && event.lessonType === 'lab') ||
          (ta.seminar_hours_per_semester > 0 && event.lessonType === 'seminar')),
    );

    if (!assignmentExists) {
      conflicts.push(event);
      continue;
    }

    // No conflicts detected; mark entities as booked
    eventMap.set(teacherKey, event);
    eventMap.set(groupKey, event);
    eventMap.set(classroomKey, event);
  }

  return conflicts;
}

function addLesson(
  events: WeeklyEvent[],
  data: DataService,
  weekdays: DayOfWeek[],
): void {
  // Select a random teaching assignment
  if (data.teachingAssignments.length === 0) return;
  const assignment =
    data.teachingAssignments[
      Math.floor(Math.random() * data.teachingAssignments.length)
      ];

  const group = data.studentGroups.find((g) => g.id === assignment.group_id);
  if (!group) return;

  const subject = data.subjects.find((s) => s.id === assignment.subject_id);
  if (!subject) return;

  const teacher = data.teachers.find((t) => t.id === assignment.teacher_id);
  if (!teacher) return;

  // Determine the lesson types that have remaining hours
  const lessonTypes: LessonType[] = [];
  if (assignment.lecture_hours_per_semester > 0) lessonTypes.push('lecture');
  if (assignment.practice_hours_per_semester > 0) lessonTypes.push('practice');
  if (assignment.lab_hours_per_semester > 0) lessonTypes.push('lab');
  if (assignment.seminar_hours_per_semester > 0) lessonTypes.push('seminar');

  if (lessonTypes.length === 0) return;

  // Randomly select a lesson type
  const lessonType = lessonTypes[Math.floor(Math.random() * lessonTypes.length)];

  // Get suitable classrooms
  const suitableClassrooms = data.classrooms.filter(
    (c) => c.capacity >= group.students_count,
  );
  if (suitableClassrooms.length === 0) return;
  const classroom =
    suitableClassrooms[
      Math.floor(Math.random() * suitableClassrooms.length)
      ];

  // Find a random day and time slot
  const dayOfWeek = weekdays[Math.floor(Math.random() * weekdays.length)];
  const timeSlot = Math.floor(Math.random() * TIME_SLOTS.length);

  // Check for conflicts
  const key = `${dayOfWeek}-${timeSlot}`;
  const teacherKey = `teacher-${teacher.id}-${key}`;
  const groupKey = `group-${group.id}-${key}`;
  const classroomKey = `classroom-${classroom.id}-${key}`;

  const eventMap = new Map<string, WeeklyEvent>();
  events.forEach((e) => {
    const k = `${e.dayOfWeek}-${e.timeSlot}`;
    eventMap.set(`teacher-${e.teacherId}-${k}`, e);
    eventMap.set(`group-${e.groupId}-${k}`, e);
    eventMap.set(`classroom-${e.classroomId}-${k}`, e);
  });

  if (
    !eventMap.has(teacherKey) &&
    !eventMap.has(groupKey) &&
    !eventMap.has(classroomKey)
  ) {
    // Add a new event
    const newEvent: WeeklyEvent = {
      title: subject.name,
      dayOfWeek: dayOfWeek,
      timeSlot: timeSlot,
      groupId: group.id,
      teacherId: teacher.id,
      subjectId: subject.id,
      classroomId: classroom.id,
      lessonType: lessonType,
    };
    events.push(newEvent);
  }
}

// Other functions remain the same


function selection(population: WeeklySchedule[]): WeeklySchedule[] {
  const selected: WeeklySchedule[] = [];
  for (let i = 0; i < population.length; i++) {
    const individual1 =
      population[Math.floor(Math.random() * population.length)];
    const individual2 =
      population[Math.floor(Math.random() * population.length)];
    const fitterIndividual =
      (individual1.fitness ?? Number.NEGATIVE_INFINITY) >
      (individual2.fitness ?? Number.NEGATIVE_INFINITY)
        ? individual1
        : individual2;
    selected.push(fitterIndividual);
  }
  return selected;
}

function crossover(
  population: WeeklySchedule[],
  crossoverRate: number,
  data: DataService,
): WeeklySchedule[] {
  const newPopulation: WeeklySchedule[] = [];
  for (let i = 0; i < population.length; i += 2) {
    const parent1 = population[i];
    const parent2 = population[i + 1];

    if (parent2 && Math.random() < crossoverRate) {
      const [child1Events, child2Events] = performConstraintPreservingCrossover(
        parent1.events,
        parent2.events,
        data,
      );

      newPopulation.push({ events: child1Events });
      newPopulation.push({ events: child2Events });
    } else {
      newPopulation.push({ events: [...parent1.events] });
      if (parent2) {
        newPopulation.push({ events: [...parent2.events] });
      }
    }
  }
  return newPopulation;
}

function mutation(
  population: WeeklySchedule[],
  mutationRate: number,
  data: DataService,
): WeeklySchedule[] {
  const weekdays: DayOfWeek[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  return population.map((individual) => {
    if (Math.random() < mutationRate) {

      let events = [...individual.events];

      const mutationChoice = Math.floor(Math.random() * 5);

      switch (mutationChoice) {
        case 0:
          // Change day_of_week of a random event to a random weekday
          if (events.length === 0) break;
          const eventIndex = Math.floor(Math.random() * events.length);
          const event = { ...events[eventIndex] }; // Clone event
          event.dayOfWeek = weekdays[Math.floor(Math.random() * weekdays.length)];
          events[eventIndex] = event;
          break;

        case 1:
          // Change time slot of a random event
          if (events.length === 0) break;
          const eventIndex1 = Math.floor(Math.random() * events.length);
          const event1 = { ...events[eventIndex1] }; // Clone event
          event1.timeSlot = Math.floor(Math.random() * TIME_SLOTS.length);
          events[eventIndex1] = event1;
          break;

        case 2:
          // Swap events between two subjects within the same group
          if (events.length < 2) break;
          const eventIndex2 = Math.floor(Math.random() * events.length);
          const event2 = { ...events[eventIndex2] };
          const swapEventIndex = Math.floor(Math.random() * events.length);
          const swapEvent = { ...events[swapEventIndex] };
          if (event2.groupId === swapEvent.groupId && eventIndex2 !== swapEventIndex) {
            // Swap timeSlot and dayOfWeek
            [event2.timeSlot, swapEvent.timeSlot] = [swapEvent.timeSlot, event2.timeSlot];
            [event2.dayOfWeek, swapEvent.dayOfWeek] = [swapEvent.dayOfWeek, event2.dayOfWeek];
            events[eventIndex2] = event2;
            events[swapEventIndex] = swapEvent;
          }
          break;

        case 3:
          addLesson(events, data, weekdays);
          break;

        case 4:
          if (events.length === 0) break;
          const eventIndexToDelete = Math.floor(Math.random() * events.length);
          events.splice(eventIndexToDelete, 1);
          break;
      }

      individual.events = events;

      // After mutation, enforce hard constraints
      const conflicts = checkHardConstraints(individual.events, data);
      if (conflicts.length > 0) {
        // Repair the schedule
        individual.events = repairSchedule(individual.events, data);
      }

      return individual;
    } else {
      return individual;
    }
  });
}

function performConstraintPreservingCrossover(
  events1: WeeklyEvent[],
  events2: WeeklyEvent[],
  data: DataService,
): [WeeklyEvent[], WeeklyEvent[]] {
  const crossoverPoint = Math.floor(Math.random() * events1.length);

  const child1Events = [
    ...events1.slice(0, crossoverPoint),
    ...events2.slice(crossoverPoint),
  ];
  const child2Events = [
    ...events2.slice(0, crossoverPoint),
    ...events1.slice(crossoverPoint),
  ];

  const repairedChild1Events = repairSchedule(child1Events, data);
  const repairedChild2Events = repairSchedule(child2Events, data);

  return [repairedChild1Events, repairedChild2Events];
}

function repairSchedule(
  events: WeeklyEvent[],
  data: DataService,
): WeeklyEvent[] {
  const repairedEvents: WeeklyEvent[] = [];
  const eventMap = new Map<string, WeeklyEvent>();
  const conflicts = checkHardConstraints(events, data);

  for (const event of events) {
    if (!conflicts.includes(event)) {
      const key = `${event.dayOfWeek}-${event.timeSlot}`;
      const teacherKey = `teacher-${event.teacherId}-${key}`;
      const groupKey = `group-${event.groupId}-${key}`;
      const classroomKey = `classroom-${event.classroomId}-${key}`;

      eventMap.set(teacherKey, event);
      eventMap.set(groupKey, event);
      eventMap.set(classroomKey, event);

      repairedEvents.push(event);
    }
  }

  for (const conflictEvent of conflicts) {
    const rescheduledEvent = findAlternativeEventForRepair(
      conflictEvent,
      eventMap,
      data,
    );
    if (rescheduledEvent) {
      const key = `${rescheduledEvent.dayOfWeek}-${rescheduledEvent.timeSlot}`;
      const teacherKey = `teacher-${rescheduledEvent.teacherId}-${key}`;
      const groupKey = `group-${rescheduledEvent.groupId}-${key}`;
      const classroomKey = `classroom-${rescheduledEvent.classroomId}-${key}`;

      eventMap.set(teacherKey, rescheduledEvent);
      eventMap.set(groupKey, rescheduledEvent);
      eventMap.set(classroomKey, rescheduledEvent);

      repairedEvents.push(rescheduledEvent);
    } else {
      console.log(
        `Unable to reschedule event: ${JSON.stringify(conflictEvent)}`,
      );
    }
  }

  return repairedEvents;
}

function findAlternativeEventForRepair(
  event: WeeklyEvent,
  eventMap: Map<string, WeeklyEvent>,
  data: DataService,
): WeeklyEvent | null {
  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ] as DayOfWeek[];

  for (const dayOfWeek of daysOfWeek) {
    for (
      let timeSlotIndex = 0;
      timeSlotIndex < TIME_SLOTS.length;
      timeSlotIndex++
    ) {
      const key = `${dayOfWeek}-${timeSlotIndex}`;
      const teacherKey = `teacher-${event.teacherId}-${key}`;
      const groupKey = `group-${event.groupId}-${key}`;
      const classroomKey = `classroom-${event.classroomId}-${key}`;

      // Check if time slot is available for teacher, group, and classroom
      if (
        !eventMap.has(teacherKey) &&
        !eventMap.has(groupKey) &&
        !eventMap.has(classroomKey)
      ) {
        // Check classroom capacity
        const group = data.studentGroups.find((g) => g.id === event.groupId);
        const classroom = data.classrooms.find(
          (c) => c.id === event.classroomId,
        );
        if (classroom && group && classroom.capacity >= group.students_count) {
          // Found an available time slot
          return { ...event, dayOfWeek, timeSlot: timeSlotIndex };
        }
      }
    }
  }

  // If no alternative time slot is found with the same classroom, try with other classrooms
  const suitableClassrooms = data.classrooms.filter(
    (c) =>
      c.capacity >=
      data.studentGroups.find((g) => g.id === event.groupId)?.students_count!,
  );

  for (const classroom of suitableClassrooms) {
    for (const dayOfWeek of daysOfWeek) {
      for (
        let timeSlotIndex = 0;
        timeSlotIndex < TIME_SLOTS.length;
        timeSlotIndex++
      ) {
        const key = `${dayOfWeek}-${timeSlotIndex}`;
        const teacherKey = `teacher-${event.teacherId}-${key}`;
        const groupKey = `group-${event.groupId}-${key}`;
        const classroomKey = `classroom-${classroom.id}-${key}`;

        if (
          !eventMap.has(teacherKey) &&
          !eventMap.has(groupKey) &&
          !eventMap.has(classroomKey)
        ) {
          // Found an available time slot with a different classroom
          return {
            ...event,
            dayOfWeek,
            timeSlot: timeSlotIndex,
            classroomId: classroom.id,
          };
        }
      }
    }
  }

  return null; // No alternative found
}
