// geneticAlgorithm.ts

import { schedules as PrismaSchedule, events as PrismaEvent, events_day_of_week } from '@prisma/client';
import { calculateFitness } from './fitnessFunction';
import { generateRandomSchedule } from './scheduleGenerator';

import { Schedule } from '../interfaces';
import { TIME_SLOTS } from '../timeSlots';

// Define the GeneticAlgorithmConfig interface
export interface GeneticAlgorithmConfig {
  populationSize: number;
  crossoverRate: number;
  mutationRate: number;
  generations: number;
}

// Extend the Schedule model to include events and fitness
type ScheduleWithEvents = PrismaSchedule & { events: PrismaEvent[]; fitness?: number };

// Main function to run the genetic algorithm
export async function runGeneticAlgorithm(
  config: GeneticAlgorithmConfig,
  data,
  semesterId: bigint
) {
  // Initialize population
  let population: ScheduleWithEvents[] = [];
  for (let i = 0; i < config.populationSize; i++) {
    const individual: ScheduleWithEvents = generateRandomSchedule(data, semesterId);
    individual.fitness = calculateFitness(individual);
    population.push(individual);
  }

  for (let generation = 0; generation < config.generations; generation++) {
    // Selection
    population = selection(population);

    // Crossover
    population = crossover(population, config.crossoverRate);

    // Mutation
    population = mutation(population, config.mutationRate, data);

    // Recalculate fitness
    population.forEach((individual) => {
      individual.fitness = calculateFitness(individual);
    });

    // Optionally, log the best fitness in this generation
    const bestFitness = Math.max(
      ...population.map((ind) => ind.fitness ?? Number.NEGATIVE_INFINITY)
    );
  }

  // Return the best individual
  return population.reduce((prev, current) =>
    (prev.fitness ?? Number.NEGATIVE_INFINITY) > (current.fitness ?? Number.NEGATIVE_INFINITY)
      ? prev
      : current
  );
}

// Selection function using tournament selection
function selection(population: ScheduleWithEvents[]): ScheduleWithEvents[] {
  const selected: ScheduleWithEvents[] = [];
  for (let i = 0; i < population.length; i++) {
    const individual1 =
      population[Math.floor(Math.random() * population.length)];
    const individual2 =
      population[Math.floor(Math.random() * population.length)];
    selected.push(
      (individual1.fitness ?? Number.NEGATIVE_INFINITY) >
      (individual2.fitness ?? Number.NEGATIVE_INFINITY)
        ? individual1
        : individual2
    );
  }
  return selected;
}

// Crossover function using single-point crossover
function crossover(
  population: ScheduleWithEvents[],
  crossoverRate: number
): ScheduleWithEvents[] {
  const newPopulation: ScheduleWithEvents[] = [];
  for (let i = 0; i < population.length; i += 2) {
    const parent1 = population[i];
    const parent2 = population[i + 1];

    if (Math.random() < crossoverRate && parent2) {
      // Single-point crossover
      const crossoverPoint = Math.floor(Math.random() * parent1.events.length);
      const child1Events = [
        ...parent1.events.slice(0, crossoverPoint),
        ...parent2.events.slice(crossoverPoint),
      ];
      const child2Events = [
        ...parent2.events.slice(0, crossoverPoint),
        ...parent1.events.slice(crossoverPoint),
      ];

      // Create new ScheduleWithEvents objects for children
      const child1: ScheduleWithEvents = {
        ...parent1,
        events: child1Events,
        fitness: undefined, // Will be recalculated
      };
      const child2: ScheduleWithEvents = {
        ...parent2,
        events: child2Events,
        fitness: undefined, // Will be recalculated
      };

      newPopulation.push(child1);
      newPopulation.push(child2);
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
  population: ScheduleWithEvents[],
  mutationRate: number,
  data
): ScheduleWithEvents[] {
  return population.map((individual) => {
    if (Math.random() < mutationRate) {
      if (!individual.events || individual.events.length === 0) {
        // Cannot mutate an event if there are no events
        return individual;
      }

      // Mutate one event in the schedule
      const eventIndex = Math.floor(Math.random() * individual.events.length);
      const event = individual.events[eventIndex];

      if (!event) {
        // Safety check in case event is undefined
        return individual;
      }

      // Randomly change group_id, day_of_week, or time slot
      const mutationChoice = Math.floor(Math.random() * 3);
      switch (mutationChoice) {
        case 0:
          // Change group_id
          const newGroup =
            data.studentGroups[
              Math.floor(Math.random() * data.studentGroups.length)
              ];
          event.group_id = newGroup.id;
          break;
        case 1:
          // Change day_of_week
          const daysOfWeek = Object.values(events_day_of_week).filter(
            (value) => typeof value === 'string'
          ) as string[];
          event.day_of_week =
            daysOfWeek[
              Math.floor(Math.random() * daysOfWeek.length)
              ] as events_day_of_week;
          break;
        case 2:
          // Change time slot
          const randomSlot =
            TIME_SLOTS[Math.floor(Math.random() * TIME_SLOTS.length)];
          event.start_time = timeStringToDate(randomSlot.start);
          event.end_time = timeStringToDate(randomSlot.end);
          break;
      }
    }
    return individual;
  });
}

// Helper function to convert time string to Date object
function timeStringToDate(timeStr: string): Date {
  const [hoursStr, minutesStr] = timeStr.split(':');
  const date = new Date(0); // Epoch time, Jan 1, 1970
  date.setHours(parseInt(hoursStr, 10), parseInt(minutesStr, 10), 0, 0);
  return date;
}