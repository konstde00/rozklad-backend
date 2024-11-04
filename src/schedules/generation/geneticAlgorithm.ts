import {
  events_day_of_week,
  events as PrismaEvent,
} from '@prisma/client';

import { WeeklySchedule } from './types';
import { calculateFitness } from './fitnessFunction';
import { generateRandomWeeklySchedule } from './scheduleGenerator';
import { DataService, GeneticAlgorithmConfig } from '../interfaces';
import { TIME_SLOTS } from '../timeSlots';
import { WeeklyEvent } from './types';

export async function runGeneticAlgorithm(
  config: GeneticAlgorithmConfig,
  data: DataService
) {
  let population: WeeklySchedule[] = [];

  // Generate initial population and enforce hard constraints
  while (population.length < config.populationSize) {
    const individual = generateRandomWeeklySchedule(data);
    // Enforce hard constraints
    if (!checkHardConstraints(individual.events, data)) {
      // Repair the schedule
      individual.events = repairSchedule(individual.events, data);
    }
    individual.fitness = calculateFitness(individual, data);
    population.push(individual);
  }

  for (let generation = 0; generation < config.generations; generation++) {
    // Selection
    population = selection(population);

    // Crossover
    population = crossover(population, config.crossoverRate, data);

    // Mutation
    population = mutation(population, config.mutationRate, data);

    // Enforce hard constraints after crossover and mutation
    population = population.map((individual) => {
      if (!checkHardConstraints(individual.events, data)) {
        // Repair the schedule
        individual.events = repairSchedule(individual.events, data);
      }
      return individual;
    });

    // Recalculate fitness
    population.forEach((individual) => {
      individual.fitness = calculateFitness(individual, data);
    });

    // Optionally, log the best fitness in this generation
    const bestFitness = Math.max(
      ...population.map((ind) => ind.fitness ?? Number.NEGATIVE_INFINITY)
    );
    // console.log(`Generation ${generation}: Best Fitness = ${bestFitness}`);
  }

  // Return the best individual
  return population.reduce((prev, current) =>
    (prev.fitness ?? Number.NEGATIVE_INFINITY) >
    (current.fitness ?? Number.NEGATIVE_INFINITY)
      ? prev
      : current
  );
}

function selection(population: WeeklySchedule[]): WeeklySchedule[] {
  const selected: WeeklySchedule[] = [];
  for (let i = 0; i < population.length; i++) {
    const individual1 = population[Math.floor(Math.random() * population.length)];
    const individual2 = population[Math.floor(Math.random() * population.length)];
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
  data: DataService
): WeeklySchedule[] {
  const newPopulation: WeeklySchedule[] = [];
  for (let i = 0; i < population.length; i += 2) {
    const parent1 = population[i];
    const parent2 = population[i + 1];

    if (parent2 && Math.random() < crossoverRate) {
      // Perform constraint-preserving crossover
      const [child1Events, child2Events] = performConstraintPreservingCrossover(
        parent1.events,
        parent2.events,
        data
      );

      newPopulation.push({ events: child1Events });
      newPopulation.push({ events: child2Events });
    } else {
      newPopulation.push(parent1);
      if (parent2) {
        newPopulation.push(parent2);
      }
    }
  }
  return newPopulation;
}

function mutation(
  population: WeeklySchedule[],
  mutationRate: number,
  data: DataService
): WeeklySchedule[] {
  const weekdays: events_day_of_week[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return population.map((individual) => {
    if (Math.random() < mutationRate) {
      if (!individual.events || individual.events.length === 0) {
        return individual;
      }

      const eventIndex = Math.floor(Math.random() * individual.events.length);
      const event = individual.events[eventIndex];

      const mutationChoice = Math.floor(Math.random() * 3);
      switch (mutationChoice) {
        case 0:
          // Change day_of_week to a weekday
          event.dayOfWeek = weekdays[Math.floor(Math.random() * weekdays.length)];
          break;
        case 1:
          // Change time slot
          event.timeSlot = Math.floor(Math.random() * TIME_SLOTS.length);
          break;
        case 2:
          // Swap events between two subjects within the same group
          const swapEventIndex = Math.floor(
            Math.random() * individual.events.length
          );
          const swapEvent = individual.events[swapEventIndex];
          if (event.groupId === swapEvent.groupId) {
            // Swap timeSlot and dayOfWeek
            [event.timeSlot, swapEvent.timeSlot] = [
              swapEvent.timeSlot,
              event.timeSlot,
            ];
            [event.dayOfWeek, swapEvent.dayOfWeek] = [
              swapEvent.dayOfWeek,
              event.dayOfWeek,
            ];
          }
          break;
      }

      // After mutation, enforce hard constraints
      if (!checkHardConstraints(individual.events, data)) {
        // Repair the schedule
        individual.events = repairSchedule(individual.events, data);
      }
    }
    return individual;
  });
}

// Constraint-preserving crossover function
function performConstraintPreservingCrossover(
  events1: WeeklyEvent[],
  events2: WeeklyEvent[],
  data: DataService
): [WeeklyEvent[], WeeklyEvent[]] {
  // Swap random portions of the schedules while ensuring hard constraints are maintained
  const crossoverPoint = Math.floor(Math.random() * events1.length);

  const child1Events = [...events1.slice(0, crossoverPoint), ...events2.slice(crossoverPoint)];
  const child2Events = [...events2.slice(0, crossoverPoint), ...events1.slice(crossoverPoint)];

  // Repair any conflicts in the children schedules
  const repairedChild1Events = repairSchedule(child1Events, data);
  const repairedChild2Events = repairSchedule(child2Events, data);

  return [repairedChild1Events, repairedChild2Events];
}

// Repair function to fix schedule conflicts
function repairSchedule(events: WeeklyEvent[], data: DataService): WeeklyEvent[] {
  // Implement a repair mechanism to resolve conflicts in the schedule
  // For simplicity, we'll remove conflicting events
  // A more sophisticated approach can reschedule conflicting events

  const repairedEvents: WeeklyEvent[] = [];
  const eventMap = new Map<string, WeeklyEvent>();

  for (const event of events) {

    const key = `${event.dayOfWeek}-${event.timeSlot}`;

    // Check for teacher, group, and classroom availability
    const isTeacherAvailable = !eventMap.has(`teacher-${event.teacherId}-${key}`);
    const isGroupAvailable = !eventMap.has(`group-${event.groupId}-${key}`);
    const isClassroomAvailable = !eventMap.has(`classroom-${event.classroomId}-${key}`);

    // Check classroom capacity
    const group = data.studentGroups.find((g) => g.id === event.groupId);
    const classroom = data.classrooms.find((c) => c.id === event.classroomId);

    const doesClassroomFitGroup = classroom && group && classroom.capacity >= group.students_count;

    // Check teacher qualification
    const isQualified = data.teacherSubjects.some(
      (ts) => ts.teacher_id === event.teacherId && ts.subject_id === event.subjectId
    );

    if (isTeacherAvailable && isGroupAvailable && isClassroomAvailable && doesClassroomFitGroup && isQualified) {
      repairedEvents.push(event);
      eventMap.set(`teacher-${event.teacherId}-${key}`, event);
      eventMap.set(`group-${event.groupId}-${key}`, event);
      eventMap.set(`classroom-${event.classroomId}-${key}`, event);
    }
    // Else, conflict detected; event is dropped
  }

  return repairedEvents;
}

// Ensure no teacher, group, or classroom is double-booked
// Ensure classroom capacity is sufficient
// Ensure teacher qualifications
function checkHardConstraints(events: WeeklyEvent[], data: DataService): boolean {

  const eventMap = new Map<string, WeeklyEvent>();

  for (const event of events) {

    const key = `${event.dayOfWeek}-${event.timeSlot}`;

    // Check for teacher availability
    const teacherKey = `teacher-${event.teacherId}-${key}`;
    if (eventMap.has(teacherKey)) {
      return false; // Teacher double-booked
    }

    // Check for group availability
    const groupKey = `group-${event.groupId}-${key}`;
    if (eventMap.has(groupKey)) {
      return false; // Group double-booked
    }

    // Check for classroom availability
    const classroomKey = `classroom-${event.classroomId}-${key}`;
    if (eventMap.has(classroomKey)) {
      return false; // Classroom double-booked
    }

    // Check classroom capacity
    const group = data.studentGroups.find((g) => g.id === event.groupId);
    const classroom = data.classrooms.find((c) => c.id === event.classroomId);
    if (classroom && group && classroom.capacity < group.students_count) {
      return false; // Classroom too small
    }

    // Check teacher qualification
    const isQualified = data.teacherSubjects.some(
      (ts) => ts.teacher_id === event.teacherId && ts.subject_id === event.subjectId
    );
    if (!isQualified) {
      return false; // Teacher not qualified
    }

    // No conflicts detected; mark entities as booked
    eventMap.set(teacherKey, event);
    eventMap.set(groupKey, event);
    eventMap.set(classroomKey, event);
  }

  return true; // All hard constraints satisfied
}
