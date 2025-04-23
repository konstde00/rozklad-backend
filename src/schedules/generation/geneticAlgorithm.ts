// geneticAlgorithm.ts

import { DayOfWeek, LessonType, PreferenceType } from '@prisma/client';

import { WeeklySchedule } from './types';
import { calculateFitness } from './fitnessFunction';
import {
  calculateSemesterWeeks, createScheduleMap,
  generateRandomWeeklySchedule, updateScheduleMap,
} from './scheduleGenerator';
import { DataService, GeneticAlgorithmConfig } from '../interfaces';
import { PAIR_SLOTS } from '../timeSlots';
import { WeeklyEvent } from './types';
import { pairToSlotIndices } from '../utils/slots';

export async function runGeneticAlgorithm(
  config: GeneticAlgorithmConfig,
  data: DataService,
  semesterId: number,
) {
  let population: WeeklySchedule[] = [];

  const semester = data.semesters.find((s) => s.id === semesterId);
  if (!semester) {
    throw new Error(`Semester with id ${semesterId} not found`);
  }

  const semesterWeeks = calculateSemesterWeeks(
    semester.start_date,
    semester.end_date,
  );

  // Generate initial population
  while (population.length < config.populationSize) {
    const individual = generateRandomWeeklySchedule(data);
    const conflicts = checkHardConstraints(individual.events, data);
    if (conflicts.length > 0) {
      individual.events = repairSchedule(individual.events, data);
    }
    individual.fitness = calculateFitness(individual, data, semesterWeeks);
    population.push(individual);
  }

  // Evolve
  for (let generation = 0; generation < config.generations; generation++) {
    population = selection(population);
    population = crossover(population, config.crossoverRate, data);
    population = mutation(population, config.mutationRate, data);

    // Repair after crossover/mutation
    population = population.map((individual) => {
      const conflicts = checkHardConstraints(individual.events, data);
      if (conflicts.length > 0) {
        individual.events = repairSchedule(individual.events, data);
      }
      return individual;
    });

    // Recompute fitness
    population.forEach((individual) => {
      individual.fitness = calculateFitness(individual, data, semesterWeeks);
    });

    const bestFitness = Math.max(
      ...population.map((ind) => ind.fitness ?? Number.NEGATIVE_INFINITY),
    );
    console.log(`Generation ${generation}: Best Fitness = ${bestFitness}`);
  }

  // Return the best from final population
  return population.reduce((prev, current) =>
    (prev.fitness ?? Number.NEGATIVE_INFINITY) >
    (current.fitness ?? Number.NEGATIVE_INFINITY)
      ? prev
      : current,
  );
}

/**
 * Check "hard" constraints:
 *   - No teacher double-booked
 *   - No group double-booked
 *   - No classroom double-booked
 *   - Classroom capacity
 *   - Teacher qualification
 *   - No more than 4 pairs per day for teacher, group, or classroom
 * Returns a list of conflicting events that violate constraints.
 */
export function checkHardConstraints(
  events: WeeklyEvent[],
  data: DataService,
): WeeklyEvent[] {
  const conflicts: WeeklyEvent[] = [];

  const DAILY_PAIR_LIMIT = PAIR_SLOTS.length;

  const teacherDayCount = new Map<string, number>();
  const groupDayCount   = new Map<string, number>();
  const classroomDayCount = new Map<string, number>();

  const usedTeacherSlot = new Map<string, WeeklyEvent>();
  const usedGroupSlot = new Map<string, WeeklyEvent>();
  const usedClassroomSlot = new Map<string, WeeklyEvent>();

  for (const event of events) {
    // Build a day/time key
    const key = `${event.dayOfWeek}-${event.timeSlot}`;

    // Check teacher's REQUIRED_FREE preferences
    const teacherPrefs = data.teacherPreferences.filter(
      (p) => p.teacher_id === event.teacherId
    );

    const [slotA, slotB] = pairToSlotIndices(event.timeSlot);

    const hasRequiredFree = teacherPrefs.some(
      (p) =>
        p.day_of_week === event.dayOfWeek &&
        p.preference === PreferenceType.REQUIRED_FREE &&
        (p.time_slot_index === slotA || p.time_slot_index === slotB)
    );

    if (hasRequiredFree) {
      conflicts.push(event);
      continue;
    }

    const { dayOfWeek, timeSlot, teacherId, groupId, classroomId } = event;

    const dayKeyTeacher = `${teacherId}-${dayOfWeek}`;
    const dayKeyGroup = `${groupId}-${dayOfWeek}`;
    const dayKeyClassroom = `${classroomId}-${dayOfWeek}`;

    // Check 4 pairs/day limit for teacher
    teacherDayCount.set(
      dayKeyTeacher,
      (teacherDayCount.get(dayKeyTeacher) || 0) + 1
    );
    if (teacherDayCount.get(dayKeyTeacher)! > DAILY_PAIR_LIMIT) {
      conflicts.push(event);
      continue;
    }

    groupDayCount.set(
      dayKeyGroup,
      (groupDayCount.get(dayKeyGroup) || 0) + 1
    );
    if (groupDayCount.get(dayKeyGroup)! > DAILY_PAIR_LIMIT) {
      conflicts.push(event);
      continue;
    }

    classroomDayCount.set(
      dayKeyClassroom,
      (classroomDayCount.get(dayKeyClassroom) || 0) + 1
    );
    if (classroomDayCount.get(dayKeyClassroom)! > DAILY_PAIR_LIMIT) {
      conflicts.push(event);
      continue;
    }

    // Check collisions in the same pair slot
    const tKey = `T-${teacherId}-${dayOfWeek}-${timeSlot}`;
    const gKey = `G-${groupId}-${dayOfWeek}-${timeSlot}`;
    const cKey = `C-${classroomId}-${dayOfWeek}-${timeSlot}`;

    if (usedTeacherSlot.has(tKey) || usedGroupSlot.has(gKey) || usedClassroomSlot.has(cKey)) {
      // conflict
      conflicts.push(event);
      continue;
    }

    // Mark them used
    usedTeacherSlot.set(tKey, event);
    usedGroupSlot.set(gKey, event);
    usedClassroomSlot.set(cKey, event);

    // Check capacity - return immediately if not enough capacity
    const group = data.studentGroups.find((g) => g.id === groupId);
    const classroom = data.classrooms.find((c) => c.id === classroomId);
    if (group && classroom && classroom.capacity < group.students_count) {
      conflicts.push(event);
      continue;
    }

    // Check teacher qualification
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
  }

  return conflicts;
}

function addLesson(
  events: WeeklyEvent[],
  data: DataService,
  weekdays: DayOfWeek[],
): void {
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

  // Determine possible lesson types
  const lessonTypes: LessonType[] = [];
  if (assignment.lecture_hours_per_semester > 0) lessonTypes.push('lecture');
  if (assignment.practice_hours_per_semester > 0) lessonTypes.push('practice');
  if (assignment.lab_hours_per_semester > 0) lessonTypes.push('lab');
  if (assignment.seminar_hours_per_semester > 0) lessonTypes.push('seminar');
  if (lessonTypes.length === 0) return;

  const lessonType = lessonTypes[Math.floor(Math.random() * lessonTypes.length)];

  // Pick a suitable classroom
  const suitableClassrooms = data.classrooms.filter(
    (c) => c.capacity >= group.students_count,
  );
  if (suitableClassrooms.length === 0) return;
  const classroom =
    suitableClassrooms[Math.floor(Math.random() * suitableClassrooms.length)];

  // Pick a random day from Mon-Fri
  const dayOfWeek = weekdays[Math.floor(Math.random() * weekdays.length)];
  // Pick a random pair index 0..3
  const pairIndex = Math.floor(Math.random() * PAIR_SLOTS.length);

  // Create a potential event
  const newEvent: WeeklyEvent = {
    title: subject.name,
    dayOfWeek,
    timeSlot: pairIndex,
    groupId: group.id,
    teacherId: teacher.id,
    subjectId: subject.id,
    classroomId: classroom.id,
    lessonType,
  };

  // We rely on checkHardConstraints for collision detection.
  // But you can do a quick check here if desired. For simplicity, just push it:
  events.push(newEvent);
}

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
          if (events.length > 0) {
            const eventIndex = Math.floor(Math.random() * events.length);
            const ev = { ...events[eventIndex] };
            ev.dayOfWeek = weekdays[Math.floor(Math.random() * weekdays.length)];
            events[eventIndex] = ev;
          }
          break;

        case 1:
          // Change pair index (timeSlot) of a random event
          if (events.length > 0) {
            const eventIndex1 = Math.floor(Math.random() * events.length);
            const ev1 = { ...events[eventIndex1] };
            ev1.timeSlot = Math.floor(Math.random() * PAIR_SLOTS.length);
            events[eventIndex1] = ev1;
          }
          break;

        case 2:
          // Swap events between two subjects within the same group
          if (events.length > 1) {
            const eIndex1 = Math.floor(Math.random() * events.length);
            const eIndex2 = Math.floor(Math.random() * events.length);
            if (eIndex1 !== eIndex2) {
              const evA = { ...events[eIndex1] };
              const evB = { ...events[eIndex2] };
              if (evA.groupId === evB.groupId) {
                // Swap dayOfWeek/timeSlot
                [evA.dayOfWeek, evB.dayOfWeek] = [evB.dayOfWeek, evA.dayOfWeek];
                [evA.timeSlot, evB.timeSlot] = [evB.timeSlot, evA.timeSlot];
                events[eIndex1] = evA;
                events[eIndex2] = evB;
              }
            }
          }
          break;

        case 3:
          // Add a new lesson
          addLesson(events, data, weekdays);
          break;

        case 4:
          // Delete a random event
          if (events.length > 0) {
            const eventIndexToDelete = Math.floor(Math.random() * events.length);
            events.splice(eventIndexToDelete, 1);
          }
          break;
      }

      individual.events = events;
      // Repair after mutation
      const conflicts = checkHardConstraints(individual.events, data);
      if (conflicts.length > 0) {
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

  const child1Events = [...events1.slice(0, crossoverPoint), ...events2.slice(crossoverPoint)];
  const child2Events = [...events2.slice(0, crossoverPoint), ...events1.slice(crossoverPoint)];

  const repairedChild1Events = repairSchedule(child1Events, data);
  const repairedChild2Events = repairSchedule(child2Events, data);

  return [repairedChild1Events, repairedChild2Events];
}

function repairSchedule(
  events: WeeklyEvent[],
  data: DataService,
): WeeklyEvent[] {
  const repairedEvents: WeeklyEvent[] = [];
  const allConflicts = checkHardConstraints(events, data);

  // We separate out the conflicting ones
  const conflictSet = new Set<WeeklyEvent>(allConflicts);

  // Keep the non-conflicting events as is
  for (const ev of events) {
    if (!conflictSet.has(ev)) {
      repairedEvents.push(ev);
    }
  }

  // Attempt to “reschedule” conflicting events
  for (const conflictEvent of conflictSet) {
    const alternative = findAlternativeEventForRepair(conflictEvent, repairedEvents, data);
    if (alternative) {
      repairedEvents.push(alternative);
    } else {
      // If no alternative found, we just skip it
      // (Alternatively, we could keep searching for more solutions.)
      // console.log(`Unable to reschedule event: ${JSON.stringify(conflictEvent)}`);
    }
  }
  return repairedEvents;
}

function findAlternativeEventForRepair(
  event: WeeklyEvent,
  existingEvents: WeeklyEvent[],
  data: DataService,
): WeeklyEvent | null {
  const weekdays: DayOfWeek[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  // Try all dayOfWeek x pairIndex combos
  for (const dayOfWeek of weekdays) {
    for (let i = 0; i < PAIR_SLOTS.length; i++) {
      const candidate: WeeklyEvent = { ...event, dayOfWeek, timeSlot: i };
      const testArr = [...existingEvents, candidate];
      const conflicts = checkHardConstraints(testArr, data);
      if (conflicts.length === 0) {
        return candidate; // found a valid re-slot
      }
    }
  }
  return null;
}
