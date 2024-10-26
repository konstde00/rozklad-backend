import { SubjectDto } from './subject.dto';

export class GroupDto {
  id: string;
  name: string;
  students_count: number;
  subjects: SubjectDto[];
}
