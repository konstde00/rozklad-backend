
export interface GeneticAlgorithmConfig {
  populationSize: number;
  crossoverRate: number;
  mutationRate: number;
  generations: number;
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
