import { DayOfWeek, PreferenceType } from '@prisma/client';

export interface GeneticAlgorithmConfig {
  populationSize: number;
  crossoverRate: number;
  mutationRate: number;
  generations: number;
}

export type TeacherPreference = {
  id: number;
  teacher_id: number;
  day_of_week: DayOfWeek;
  time_slot_index: number;
  preference: PreferenceType;
};

export interface DataService {
  semesters: any[];
  studentGroups: any[];
  subjects: any[];
  teachers: any[];
  classrooms: any[];
  teachingAssignments: any[];
  timeSlots: any[];

  teacherPreferences: TeacherPreference[];
}
