import { runGeneticAlgorithm } from './geneticAlgorithm';
import { GeneticAlgorithmConfig } from '../interfaces';
import { generateRandomWeeklySchedule } from './scheduleGenerator';
import { calculateFitness } from './fitnessFunction';
import { WeeklyEvent, WeeklySchedule } from './types';
import { expandWeeklyScheduleToSemester } from './expandWeeklySchedule';
import { TIME_SLOTS } from '../timeSlots';
import _ from 'lodash';
import { DayOfWeek, LessonType, PreferenceType } from '@prisma/client';

describe('Genetic Algorithm', () => {
  let data: any;
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
          start_date: new Date('2024-09-01T00:00:00Z'), // UTC
          end_date: new Date('2024-12-08T00:00:00Z'),   // UTC
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
        // NEW TEACHER for testing REQUIRED_FREE
        {
          id: 3,
          first_name: 'Charlie',
          last_name: 'White',
          max_hours_per_week: 10,
          created_at: new Date(),
          updated_at: new Date(),
          user: {
            id: 3,
            username: 'charlie',
            email: 'charlie@example.com',
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
        {
          id: 4,
          teacher_id: 3,    // Charlie
          group_id: 2,      // Group B
          course_number: 1,
          subject_id: 2,    // Web Technologies
          lecture_hours_per_semester: 5,
          practice_hours_per_semester: 5,
          lab_hours_per_semester: 0,
          seminar_hours_per_semester: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      timeSlots: TIME_SLOTS,

      teacherPreferences: [
        {
          id: 500,
          teacher_id: 3,
          day_of_week: DayOfWeek.Monday,    // Monday
          time_slot_index: 0,              // 08:40-09:25
          preference: PreferenceType.REQUIRED_FREE, // Hard constraint
          created_at: new Date(),
          updated_at: new Date(),
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
      expect(event.lessonType).toBeDefined();
    });
  });

  it('should correctly calculate fitness of a weekly schedule', () => {
    const clonedData = _.cloneDeep(data);
    const weeklySchedule: WeeklySchedule = generateRandomWeeklySchedule(clonedData);
    const fitness = calculateFitness(weeklySchedule, clonedData, weeksInSemester);
    expect(typeof fitness).toBe('number');
  });

  it('should run the genetic algorithm and return a valid weekly schedule', async () => {
    const clonedData = _.cloneDeep(data);
    const bestWeeklySchedule = await runGeneticAlgorithm(config, clonedData, semesterId);
    expect(bestWeeklySchedule.events.length).toBeGreaterThan(0);
    expect(typeof bestWeeklySchedule.fitness).toBe('number');

    // Ensure best schedule meets constraints
    const fitness = calculateFitness(bestWeeklySchedule, clonedData, weeksInSemester);
    expect(fitness).toBe(bestWeeklySchedule.fitness);
  });

  it('should generate schedules that meet all hours per semester requirements', async () => {
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

    // Initialize a map to track total scheduled hours per group per subject per lesson type
    const groupSubjectLessonTypeHours = new Map<string, number>();

    // Aggregate scheduled hours based on group_id, subject_id, and lesson_type
    fullSemesterEvents.forEach((event) => {
      const key = `${event.group_id}-${event.subject_id}-${event.lesson_type}`;
      const eventDuration = 1; // Each lesson is 1 hour

      if (groupSubjectLessonTypeHours.has(key)) {
        groupSubjectLessonTypeHours.set(
          key,
          groupSubjectLessonTypeHours.get(key)! + eventDuration,
        );
      } else {
        groupSubjectLessonTypeHours.set(key, eventDuration);
      }
    });

    // Verify that scheduled hours meet or are within a tolerance of the required hours
    groupSubjectLessonTypeHours.forEach((scheduledHours, key) => {
      const [groupIdStr, subjectIdStr, lessonTypeStr] = key.split('-');

      const groupId = parseInt(groupIdStr, 10);
      const subjectId = parseInt(subjectIdStr, 10);
      const lessonType = lessonTypeStr as LessonType;

      const assignment = clonedData.teachingAssignments.find(
        (ta) => ta.group_id === groupId && ta.subject_id === subjectId,
      );

      if (!assignment) {
        throw new Error(
          `TeachingAssignment for group ${groupId}, subject ${subjectId} not found`
        );
      }

      let requiredHours = 0;
      if (lessonType === 'lecture') {
        requiredHours = assignment.lecture_hours_per_semester;
      } else if (lessonType === 'practice') {
        requiredHours = assignment.practice_hours_per_semester;
      } else if (lessonType === 'lab') {
        requiredHours = assignment.lab_hours_per_semester;
      } else if (lessonType === 'seminar') {
        requiredHours = assignment.seminar_hours_per_semester;
      }

      const toleranceHours = 12;

      if (Math.abs(scheduledHours - requiredHours) > toleranceHours) {
        console.error(
          `Scheduled hours do not meet required hours for group: ${groupId.toString()}, subject: ${subjectId.toString()}, type: ${lessonType}, required: ${requiredHours}, scheduled: ${scheduledHours}`,
        );
      }

      expect(Math.abs(scheduledHours - requiredHours)).toBeLessThanOrEqual(toleranceHours);
    });
  });

  // Helper function to check for schedule conflicts
  function checkScheduleConflicts(
    entity: 'teacher' | 'group' | 'classroom',
    events: WeeklyEvent[],
  ) {
    const schedule = new Map<string, Set<number>>();
    const conflicts: string[] = [];

    events.forEach((event) => {
      const day = event.dayOfWeek;
      const timeSlot = event.timeSlot;
      const entityId =
        entity === 'teacher'
          ? event.teacherId.toString()
          : entity === 'group'
            ? event.groupId.toString()
            : event.classroomId.toString();

      const key = `${entityId}-${day}`;

      if (!schedule.has(key)) {
        schedule.set(key, new Set());
      }

      const timeSlots = schedule.get(key)!;

      if (timeSlots.has(timeSlot)) {
        conflicts.push(
          `${entity} ${entityId} has more than one class at time slot ${timeSlot} on ${day}`,
        );
      } else {
        timeSlots.add(timeSlot);
      }
    });

    return conflicts;
  }

  it('should schedule teachers to teach only one class at a time', async () => {
    const bestWeeklySchedule = await runGeneticAlgorithm(config, data, semesterId);

    const conflicts = checkScheduleConflicts('teacher', bestWeeklySchedule.events);

    if (conflicts.length > 0) {
      console.error('Conflicts found:', conflicts);
    }

    expect(conflicts.length).toBe(0);
  });

  it('should schedule groups to have only one class at a time', async () => {
    const clonedData = _.cloneDeep(data);
    const bestWeeklySchedule = await runGeneticAlgorithm(config, clonedData, semesterId);

    const conflicts = checkScheduleConflicts('group', bestWeeklySchedule.events);

    if (conflicts.length > 0) {
      console.error('Conflicts found:', conflicts);
    }

    expect(conflicts.length).toBe(0);
  });

  it('should schedule classrooms to be used for only one class at a time', async () => {
    const clonedData = _.cloneDeep(data);
    const bestWeeklySchedule = await runGeneticAlgorithm(config, clonedData, semesterId);

    const conflicts = checkScheduleConflicts('classroom', bestWeeklySchedule.events);

    if (conflicts.length > 0) {
      console.error('Conflicts found:', conflicts);
    }

    expect(conflicts.length).toBe(0);
  });

  it('should not schedule the new teacher (ID=3) in his REQUIRED_FREE slot', async () => {
    const bestWeeklySchedule = await runGeneticAlgorithm(config, data, semesterId);

    // Teacher #3's preference is Monday, timeSlot=0, REQUIRED_FREE
    const invalidEvents = bestWeeklySchedule.events.filter(
      (ev) =>
        ev.teacherId === 3 &&
        ev.dayOfWeek === DayOfWeek.Monday &&
        ev.timeSlot === 0
    );

    if (invalidEvents.length > 0) {
      console.error(
        'Found events scheduled in a REQUIRED_FREE slot for teacher #3:',
        invalidEvents
      );
    }

    // We expect none
    expect(invalidEvents.length).toBe(0);
  });
});
