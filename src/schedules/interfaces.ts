// interfaces.ts

export interface Event {
  id?: bigint;
  title: string;
  description?: string;
  day_of_week: string;
  start_time: Date;
  end_time: Date;
  schedule_id: number;
  group_id: bigint;
  teacher_id: bigint;
  subject_id: bigint;
  classroom_id: number;
}

export enum DayOfWeek {
  Monday,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
  Sunday,
}

export interface Schedule {
  events: Event[];
  fitness?: number;
}

export interface GeneticAlgorithmConfig {
  populationSize: number;
  crossoverRate: number;
  mutationRate: number;
  generations: number;
}

export interface TeacherAvailability {
  teacherId: bigint;
  availableHoursPerWeek: number;
}

export interface ClassroomAvailability {
  classroomId: number;
  capacity: number;
}

export interface DataService {
  semesters: any[];
  studentGroups: any[];
  subjects: any[];
  teachers: any[];
  classrooms: any[];
  teacherSubjects: any[];
  groupSubjects: any[];
}
