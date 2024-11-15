
import { EventDto } from './event.dto';

export class ScheduleDto {
  id: string;
  name: string;
  semesterId: string;
  semesterTitle: string;
  events: EventDto[];
}
