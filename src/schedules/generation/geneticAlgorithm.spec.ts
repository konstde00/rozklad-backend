import { runGeneticAlgorithm } from './geneticAlgorithm';
import { GeneticAlgorithmConfig } from '../interfaces';
import { generateRandomWeeklySchedule } from './generateRandomSchedule';
import { calculateFitness } from './fitnessFunction';
import { WeeklySchedule } from './types';
import { expandWeeklyScheduleToSemester } from './expandWeeklySchedule';
import { TIME_SLOTS } from '../timeSlots';

describe('Genetic Algorithm', () => {
  let data;
  let config: GeneticAlgorithmConfig;

  beforeAll(() => {
    data = {
      semesters: [
        {
          id: BigInt(1),
          title: 'Fall Semester',
          start_date: new Date('2023-09-01T00:00:00Z'), // UTC
          end_date: new Date('2023-12-31T23:59:59Z'), // UTC
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      studentGroups: [
        {
          id: BigInt(1),
          name: 'Group A',
          study_year: 1,
          students_count: 30,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: BigInt(2),
          name: 'Group B',
          study_year: 1,
          students_count: 25,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      subjects: [
        {
          id: BigInt(1),
          name: 'Mathematics',
          hours_per_semester: 80,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: BigInt(2),
          name: 'Physics',
          hours_per_semester: 45,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      teachers: [
        {
          id: BigInt(1),
          max_hours_per_week: 40,
          created_at: new Date(),
          updated_at: new Date(),
          users: {
            id: BigInt(1),
            username: 'alice',
            email: 'alice@example.com',
            password_hash: 'password',
            role: 'teacher',
            created_at: new Date(),
            updated_at: new Date(),
          },
        },
        {
          id: BigInt(2),
          max_hours_per_week: 15,
          created_at: new Date(),
          updated_at: new Date(),
          users: {
            id: BigInt(2),
            username: 'bob',
            email: 'bob@example.com',
            password_hash: 'password',
            role: 'teacher',
            created_at: new Date(),
            updated_at: new Date(),
          },
        },
      ],
      classrooms: [
        {
          id: 1,
          name: 'Room 101',
          capacity: 35,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          name: 'Room 102',
          capacity: 40,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      teacherSubjects: [
        {
          teacher_id: BigInt(1),
          subject_id: BigInt(1), // Alice can teach Mathematics
        },
        {
          teacher_id: BigInt(2),
          subject_id: BigInt(2), // Bob can teach Physics
        },
      ],
      groupSubjects: [
        {
          group_id: BigInt(1),
          subject_id: BigInt(1), // Group A studies Mathematics
        },
        {
          group_id: BigInt(1),
          subject_id: BigInt(2), // Group A studies Physics
        },
        {
          group_id: BigInt(2),
          subject_id: BigInt(1), // Group B studies Mathematics
        },
      ],
    };

    config = {
      populationSize: 10,
      crossoverRate: 0.7,
      mutationRate: 0.1,
      generations: 10,
    };
  });

  it('should generate an initial weekly schedule', () => {
    const weeklySchedule: WeeklySchedule = generateRandomWeeklySchedule(data);
    expect(weeklySchedule.events.length).toBeGreaterThan(0);

    console.log(weeklySchedule);

    // Ensure events have correct properties
    weeklySchedule.events.forEach((event) => {
      expect(event.title).toBeDefined();
      expect(event.dayOfWeek).toBeDefined();
      expect(event.timeSlot).toBeGreaterThanOrEqual(0);
      expect(event.timeSlot).toBeLessThan(TIME_SLOTS.length);
      expect(event.groupId).toBeDefined();
      expect(event.teacherId).toBeDefined();
      expect(event.subjectId).toBeDefined();
      expect(event.classroomId).toBeDefined();
    });
  });

  it('should correctly calculate fitness of a weekly schedule', () => {
    const weeklySchedule: WeeklySchedule = generateRandomWeeklySchedule(data);
    const fitness = calculateFitness(weeklySchedule, data);
    expect(typeof fitness).toBe('number');
  });

  it('should run the genetic algorithm and return a valid weekly schedule', async () => {
    const bestWeeklySchedule = await runGeneticAlgorithm(config, data);
    expect(bestWeeklySchedule.events.length).toBeGreaterThan(0);
    expect(typeof bestWeeklySchedule.fitness).toBe('number');

    // Ensure best schedule meets constraints
    const fitness = calculateFitness(bestWeeklySchedule, data);
    expect(fitness).toBe(bestWeeklySchedule.fitness);
  });

  it('should generate schedules that meet hours_per_semester requirements', async () => {
    const bestWeeklySchedule = await runGeneticAlgorithm(config, data);
    const semesterStartDate = data.semesters[0].start_date;
    const semesterEndDate = data.semesters[0].end_date;

    const fullSemesterEvents = await expandWeeklyScheduleToSemester(
      bestWeeklySchedule,
      semesterStartDate,
      semesterEndDate
    );

    // Calculate total scheduled hours per subject per group
    const groupSubjectHours = new Map<string, number>();

    fullSemesterEvents.forEach((event) => {
      const key = `${event.group_id}-${event.subject_id}`;
      const eventDuration = 0.75; // Each lesson is 0.75 hours

      if (groupSubjectHours.has(key)) {
        groupSubjectHours.set(key, groupSubjectHours.get(key)! + eventDuration);
      } else {
        groupSubjectHours.set(key, eventDuration);
      }
    });

    // Verify scheduled hours meet required hours
    groupSubjectHours.forEach((scheduledHours, key) => {
      const [groupIdStr, subjectIdStr] = key.split('-');
      const subjectId = BigInt(subjectIdStr);

      const subject = data.subjects.find((s) => s.id === subjectId);
      if (!subject) return;

      const requiredHours = subject.hours_per_semester;

      // Allow a small tolerance due to rounding
      const tolerance = 1;

      expect(Math.abs(scheduledHours - requiredHours)).toBeLessThanOrEqual(
        tolerance
      );
    });
  });

});
