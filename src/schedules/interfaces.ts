
export interface Event {
  id?: bigint;
  title: string;
  description?: string;
  dayOfWeek: DayOfWeek;
  startTime: Date;
  endTime: Date;
  scheduleId: number;
  groupId: bigint;
  teacherId: bigint;
  subjectId: bigint;
  classroomId: number;
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
