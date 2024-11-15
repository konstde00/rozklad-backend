
import { LessonType, DayOfWeek } from '@prisma/client';

export class EventDto {
  id: string;
  title: string;
  dayOfWeek: DayOfWeek;
  startTime: string;       // 'HH:MM' format
  endTime: string;         // 'HH:MM' format
  scheduleId: string;
  groupName: string;
  teacherName: string;
  subjectName: string;
  classroomName: string;
  lessonType: LessonType;
}
