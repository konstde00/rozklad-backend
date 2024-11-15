
import { TeachingAssignmentDto } from './teaching-assignment.dto';

export class GroupDto {
  id: string;
  name: string;
  study_year: number;
  students_count: number;
  course_number: number;
  teachingAssignments: TeachingAssignmentDto[];
}
