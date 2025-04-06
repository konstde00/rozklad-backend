// geneticAlgorithm.spec.ts

import { runGeneticAlgorithm } from './geneticAlgorithm';
import { GeneticAlgorithmConfig } from '../interfaces';
import { generateRandomWeeklySchedule } from './scheduleGenerator';
import { calculateFitness } from './fitnessFunction';
import { WeeklyEvent, WeeklySchedule } from './types';
import { expandWeeklyScheduleToSemester } from './expandWeeklySchedule';
import { TIME_SLOTS, PAIR_SLOTS } from '../timeSlots';  // note we reference pairs
import _ from 'lodash';
import { LessonType } from '@prisma/client';

describe('Genetic Algorithm', () => {
  let data;
  let semesterId: number;
  let weeksInSemester: number;
  let config: GeneticAlgorithmConfig;

  beforeEach(() => {
    semesterId = 1;
    weeksInSemester = 14;
    data = {
      semesters: [
        {
          id: 1,
          title: 'First Semester 2024',
          start_date: new Date('2024-09-01T00:00:00Z'),
          end_date: new Date('2024-12-08T00:00:00Z'),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      studentGroups: [
        {
          id: 1,
          name: 'Group A',
          study_year: 1,
          students_count: 30,
          course_number: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          name: 'Group B',
          study_year: 1,
          students_count: 25,
          course_number: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      subjects: [
        {
          id: 1,
          name: 'Statistic Modelling',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          name: 'Web Technologies',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      teachers: [
        {
          id: 1,
          first_name: 'Alice',
          last_name: 'Smith',
          max_hours_per_week: 40,
          created_at: new Date(),
          updated_at: new Date(),
          user: {
            id: 1,
            username: 'alice',
            email: 'alice@example.com',
            password_hash: 'password',
            role: 'teacher',
            created_at: new Date(),
            updated_at: new Date(),
          },
        },
        {
          id: 2,
          first_name: 'Bob',
          last_name: 'Johnson',
          max_hours_per_week: 40,
          created_at: new Date(),
          updated_at: new Date(),
          user: {
            id: 2,
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
      teachingAssignments: [
        {
          id: 1,
          teacher_id: 1,    // Alice
          group_id: 1,      // Group A
          course_number: 1,
          subject_id: 1,    // Statistic Modelling
          lecture_hours_per_semester: 28,
          practice_hours_per_semester: 42,
          lab_hours_per_semester: 14,
          seminar_hours_per_semester: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          teacher_id: 1,    // Alice
          group_id: 2,      // Group B
          course_number: 1,
          subject_id: 1,    // Statistic Modelling
          lecture_hours_per_semester: 28,
          practice_hours_per_semester: 42,
          lab_hours_per_semester: 14,
          seminar_hours_per_semester: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 3,
          teacher_id: 2,    // Bob
          group_id: 1,      // Group A
          course_number: 1,
          subject_id: 2,    // Web Technologies
          lecture_hours_per_semester: 30,
          practice_hours_per_semester: 40,
          lab_hours_per_semester: 16,
          seminar_hours_per_semester: 12,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      timeSlots: TIME_SLOTS,
    };

    config = {
      populationSize: 2500,
      crossoverRate: 0.7,
      mutationRate: 0.1,
      generations: 100,
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should generate an initial weekly schedule with only valid pair indices', () => {
    const clonedData = _.cloneDeep(data);
    const weeklySchedule: WeeklySchedule = generateRandomWeeklySchedule(clonedData);
    expect(weeklySchedule.events.length).toBeGreaterThan(0);

    // Ensure events have correct properties
    weeklySchedule.events.forEach((event) => {
      expect(event.title).toBeDefined();
      expect(event.dayOfWeek).toBeDefined();

      // Now only 0..3 is allowed for timeSlot
      expect(event.timeSlot).toBeGreaterThanOrEqual(0);
      expect(event.timeSlot).toBeLessThan(PAIR_SLOTS.length);

      expect(event.groupId).toBeDefined();
      expect(event.teacherId).toBeDefined();
      expect(event.subjectId).toBeDefined();
      expect(event.classroomId).toBeDefined();
      expect(event.lessonType).toBeDefined();
    });
  });

  it('should correctly calculate fitness of a weekly schedule', () => {
    const clonedData = _.cloneDeep(data);
    const weeklySchedule: WeeklySchedule = generateRandomWeeklySchedule(clonedData);
    const fitness = calculateFitness(weeklySchedule, clonedData, weeksInSemester);
    expect(typeof fitness).toBe('number');
  });

  it('should run the genetic algorithm and return a valid weekly schedule with pair constraints', async () => {
    const clonedData = _.cloneDeep(data);
    const bestWeeklySchedule = await runGeneticAlgorithm(config, clonedData, semesterId);
    expect(bestWeeklySchedule.events.length).toBeGreaterThan(0);
    expect(typeof bestWeeklySchedule.fitness).toBe('number');

    // Ensure best schedule meets constraints
    const fitness = calculateFitness(bestWeeklySchedule, clonedData, weeksInSemester);
    expect(fitness).toBe(bestWeeklySchedule.fitness);

    // Also check no event has an invalid pair index
    bestWeeklySchedule.events.forEach((evt) => {
      expect(evt.timeSlot).toBeGreaterThanOrEqual(0);
      expect(evt.timeSlot).toBeLessThanOrEqual(3);
    });
  });

  it('should generate schedules that meet all hours per semester requirements (within tolerance)', async () => {
    const clonedData = _.cloneDeep(data);
    const bestWeeklySchedule = await runGeneticAlgorithm(config, clonedData, semesterId);
    const semesterStartDate = clonedData.semesters[0].start_date;
    const semesterEndDate = clonedData.semesters[0].end_date;

    console.log('Best Weekly Schedule:', JSON.stringify(bestWeeklySchedule, null, 2));

    const fullSemesterEvents = await expandWeeklyScheduleToSemester(
      bestWeeklySchedule,
      semesterStartDate,
      semesterEndDate,
    );

    const groupSubjectLessonTypeHours = new Map<string, number>();

    // If each pair is 2 hours, we count 2. If 1, count 1.
    const hoursPerPair = 2;

    fullSemesterEvents.forEach((event) => {
      const key = `${event.group_id}-${event.subject_id}-${event.lesson_type}`;
      if (!groupSubjectLessonTypeHours.has(key)) {
        groupSubjectLessonTypeHours.set(key, 0);
      }
      groupSubjectLessonTypeHours.set(
        key,
        groupSubjectLessonTypeHours.get(key)! + hoursPerPair
      );
    });

    // Compare against required assignment hours
    groupSubjectLessonTypeHours.forEach((scheduledHours, key) => {
      const [groupIdStr, subjectIdStr, lessonTypeStr] = key.split('-');
      const groupId = Number(groupIdStr);
      const subjectId = Number(subjectIdStr);
      const lessonType = lessonTypeStr as LessonType;

      const assignment = clonedData.teachingAssignments.find(
        (ta) => ta.group_id === groupId && ta.subject_id === subjectId,
      );
      if (!assignment) return;

      let requiredHours = 0;
      switch (lessonType) {
        case 'lecture':
          requiredHours = assignment.lecture_hours_per_semester;
          break;
        case 'practice':
          requiredHours = assignment.practice_hours_per_semester;
          break;
        case 'lab':
          requiredHours = assignment.lab_hours_per_semester;
          break;
        case 'seminar':
          requiredHours = assignment.seminar_hours_per_semester;
          break;
      }

      // We'll allow a tolerance
      const toleranceHours = 12;

      if (Math.abs(scheduledHours - requiredHours) > toleranceHours) {
        console.error(
          `Scheduled hours do not meet required hours for group: ${groupId}, subject: ${subjectId}, type: ${lessonType}, required: ${requiredHours}, scheduled: ${scheduledHours}`,
        );
      }
      expect(Math.abs(scheduledHours - requiredHours)).toBeLessThanOrEqual(toleranceHours);
    });
  });

  // Helper function to check for schedule collisions
  function checkScheduleConflicts(
    entity: 'teacher' | 'group' | 'classroom',
    events: WeeklyEvent[],
  ) {
    const schedule = new Map<string, Set<number>>();
    const conflicts: string[] = [];

    // entityId-dayOfWeek => set of used pairIndices
    events.forEach((event) => {
      const day = event.dayOfWeek;
      const pairIndex = event.timeSlot;
      let entityId: string;
      switch (entity) {
        case 'teacher':
          entityId = `${event.teacherId}`;
          break;
        case 'group':
          entityId = `${event.groupId}`;
          break;
        case 'classroom':
          entityId = `${event.classroomId}`;
          break;
      }
      const key = `${entityId}-${day}`;
      if (!schedule.has(key)) {
        schedule.set(key, new Set());
      }
      const usedPairs = schedule.get(key)!;
      if (usedPairs.has(pairIndex)) {
        conflicts.push(
          `${entity} ${entityId} has more than one class at pair ${pairIndex} on ${day}`
        );
      } else {
        usedPairs.add(pairIndex);
      }
    });
    return conflicts;
  }

  it('should schedule teachers to teach only one class at a time (pair)', async () => {
    const bestWeeklySchedule = await runGeneticAlgorithm(config, data, semesterId);
    const conflicts = checkScheduleConflicts('teacher', bestWeeklySchedule.events);
    if (conflicts.length > 0) {
      console.error('Teacher Conflicts found:', conflicts);
    }
    expect(conflicts.length).toBe(0);
  });

  it('should schedule groups to have only one class at a time (pair)', async () => {
    const clonedData = _.cloneDeep(data);
    const bestWeeklySchedule = await runGeneticAlgorithm(config, clonedData, semesterId);

    const conflicts = checkScheduleConflicts('group', bestWeeklySchedule.events);
    if (conflicts.length > 0) {
      console.error('Group Conflicts found:', conflicts);
    }
    expect(conflicts.length).toBe(0);
  });

  it('should schedule classrooms to be used only once at a time (pair)', async () => {
    const clonedData = _.cloneDeep(data);
    const bestWeeklySchedule = await runGeneticAlgorithm(config, clonedData, semesterId);

    const conflicts = checkScheduleConflicts('classroom', bestWeeklySchedule.events);
    if (conflicts.length > 0) {
      console.error('Classroom Conflicts found:', conflicts);
    }
    expect(conflicts.length).toBe(0);
  });

  it('should not exceed 4 pairs in any single day for teacher, group, or classroom', async () => {
    const clonedData = _.cloneDeep(data);
    const bestWeeklySchedule = await runGeneticAlgorithm(config, clonedData, semesterId);

    // Count pairs per day for each teacher, group, and classroom
    const dayCountsTeacher = new Map<string, number>();   // teacherId-dayOfWeek => count
    const dayCountsGroup = new Map<string, number>();     // groupId-dayOfWeek => count
    const dayCountsClassroom = new Map<string, number>(); // classroomId-dayOfWeek => count

    for (const e of bestWeeklySchedule.events) {
      const tKey = `${e.teacherId}-${e.dayOfWeek}`;
      dayCountsTeacher.set(tKey, (dayCountsTeacher.get(tKey) || 0) + 1);

      const gKey = `${e.groupId}-${e.dayOfWeek}`;
      dayCountsGroup.set(gKey, (dayCountsGroup.get(gKey) || 0) + 1);

      const cKey = `${e.classroomId}-${e.dayOfWeek}`;
      dayCountsClassroom.set(cKey, (dayCountsClassroom.get(cKey) || 0) + 1);
    }

    // Check that none exceed 4
    dayCountsTeacher.forEach((count, k) => {
      expect(count).toBeLessThanOrEqual(4);
    });
    dayCountsGroup.forEach((count, k) => {
      expect(count).toBeLessThanOrEqual(4);
    });
    dayCountsClassroom.forEach((count, k) => {
      expect(count).toBeLessThanOrEqual(4);
    });
  });
});
