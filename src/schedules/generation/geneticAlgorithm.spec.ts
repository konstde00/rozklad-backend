import { runGeneticAlgorithm } from './geneticAlgorithm';
import { GeneticAlgorithmConfig } from '../interfaces';
import { generateRandomWeeklySchedule } from './scheduleGenerator';
import { calculateFitness } from './fitnessFunction';
import { WeeklyEvent, WeeklySchedule } from './types';
import { expandWeeklyScheduleToSemester } from './expandWeeklySchedule';
import { TIME_SLOTS } from '../timeSlots';
import _ from 'lodash';

describe('Genetic Algorithm', () => {
  let data;
  let config: GeneticAlgorithmConfig;

  beforeEach(() => {
    data = {
      semesters: [
        {
          id: BigInt(1),
          title: 'Fall Semester',
          start_date: new Date('2024-09-01T00:00:00Z'), // UTC
          end_date: new Date('2024-12-15T23:59:59Z'), // UTC
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
          hours_per_semester: 55,
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
          max_hours_per_week: 35,
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

  afterEach(() => {
    // Reset any global mocks or overrides here
    jest.resetAllMocks();
  });

  it('should generate an initial weekly schedule', () => {
    const clonedData = _.cloneDeep(data);
    const weeklySchedule: WeeklySchedule = generateRandomWeeklySchedule(clonedData);
    expect(weeklySchedule.events.length).toBeGreaterThan(0);

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
    const clonedData = _.cloneDeep(data);
    const weeklySchedule: WeeklySchedule = generateRandomWeeklySchedule(clonedData);
    const fitness = calculateFitness(weeklySchedule, clonedData);
    expect(typeof fitness).toBe('number');
  });

  it('should run the genetic algorithm and return a valid weekly schedule', async () => {
    const clonedData = _.cloneDeep(data);
    const bestWeeklySchedule = await runGeneticAlgorithm(config, clonedData);
    expect(bestWeeklySchedule.events.length).toBeGreaterThan(0);
    expect(typeof bestWeeklySchedule.fitness).toBe('number');

    // Ensure best schedule meets constraints
    const fitness = calculateFitness(bestWeeklySchedule, clonedData);
    expect(fitness).toBe(bestWeeklySchedule.fitness);
  });

  it('should generate schedules that meet hours_per_semester requirements', async () => {
    const clonedData = _.cloneDeep(data);
    const bestWeeklySchedule = await runGeneticAlgorithm(config, clonedData);
    const semesterStartDate = clonedData.semesters[0].start_date;
    const semesterEndDate = clonedData.semesters[0].end_date;

    (BigInt.prototype as any).toJSON = function () {
      return this.toString()
    }

    console.log('Best Weekly Schedule:', JSON.stringify(bestWeeklySchedule, null, 2));

    const fullSemesterEvents = await expandWeeklyScheduleToSemester(
      bestWeeklySchedule,
      semesterStartDate,
      semesterEndDate,
    );

    // Initialize a map to track total scheduled hours per group per subject
    const groupSubjectHours = new Map<string, number>();

    // Aggregate scheduled hours based on group_id and subject_id
    fullSemesterEvents.forEach((event) => {
      const key = `${event.group_id}-${event.subject_id}`;
      const eventDuration = 0.75; // Each lesson is 0.75 hours

      if (groupSubjectHours.has(key)) {
        groupSubjectHours.set(key, groupSubjectHours.get(key)! + eventDuration);
      } else {
        groupSubjectHours.set(key, eventDuration);
      }
    });


    // Verify that scheduled hours meet or are within a tolerance of the required hours
    groupSubjectHours.forEach((scheduledHours, key) => {

      const [groupIdStr, subjectIdStr] = key.split('-');
      const subjectId = BigInt(subjectIdStr);

      const subject = clonedData.subjects.find((s) => s.id === subjectId);
      if (!subject) {
        throw new Error(`Subject with id ${subjectId} not found`);
      }

      const requiredHours = subject.hours_per_semester;

      // 3 hours
      const tolerance = 3;

      console.log('Group:', groupIdStr, 'Subject:', subject.name, 'Required Hours:', requiredHours, 'Scheduled Hours:', scheduledHours);

      expect(Math.abs(scheduledHours - requiredHours)).toBeLessThanOrEqual(tolerance);
    });
  });

  // Helper function to check for schedule conflicts
  function checkScheduleConflicts(entity: 'teacher' | 'group' | 'classroom', events: WeeklyEvent[]) {
    const schedule = new Map<string, Set<number>>();
    let conflicts = [];

    events.forEach((event) => {
      const day = event.dayOfWeek;
      const timeSlot = event.timeSlot;
      const entityId = entity === 'teacher' ? event.teacherId :
        entity === 'group' ? event.groupId :
          event.classroomId;

      const key = `${entityId}-${day}`;

      if (!schedule.has(key)) {
        schedule.set(key, new Set());
      }

      const timeSlots = schedule.get(key)!;

      if (timeSlots.has(timeSlot)) {
        conflicts.push(`${entity} ${entityId} has more than one class at time slot ${timeSlot} on ${day}`);
      } else {
        timeSlots.add(timeSlot);
      }
    });

    return conflicts;
  }

  it('should schedule lecturers to teach only one class at a time', async () => {
    const clonedData = _.cloneDeep(data);
    const bestWeeklySchedule = await runGeneticAlgorithm(config, clonedData);

    const conflicts = checkScheduleConflicts('teacher', bestWeeklySchedule.events);

    if (conflicts.length > 0) {
      console.error('Conflicts found:', conflicts);
    }

    expect(conflicts.length).toBe(0);
  });

  it('should schedule groups to have only one class at a time', async () => {
    const clonedData = _.cloneDeep(data);
    const bestWeeklySchedule = await runGeneticAlgorithm(config, clonedData);

    const conflicts = checkScheduleConflicts('group', bestWeeklySchedule.events);

    if (conflicts.length > 0) {
      console.error('Conflicts found:', conflicts);
    }

    expect(conflicts.length).toBe(0);
  });

  it('should schedule classrooms to be used for only one class at a time', async () => {
    const clonedData = _.cloneDeep(data);
    const bestWeeklySchedule = await runGeneticAlgorithm(config, clonedData);

    const conflicts = checkScheduleConflicts('classroom', bestWeeklySchedule.events);

    if (conflicts.length > 0) {
      console.error('Conflicts found:', conflicts);
    }

    expect(conflicts.length).toBe(0);
  });
});
