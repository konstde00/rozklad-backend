import { EventDto } from './event.dto';

export class ScheduleDto {
  id: string;
  name: string;
  ownerId: string;
  semesterId: string;
  semesterTitle: string;
  events: EventDto[];
}
