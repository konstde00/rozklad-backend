
import { TeachingAssignmentDto } from './teaching-assignment.dto';

export class GroupDto {
  id: string;
  name: string;
  speciality: number;
  students_count: number;
  teachingAssignments: TeachingAssignmentDto[];
}
