// src/schedules/generation/scheduleGenerator.ts
import { DayOfWeek, LessonType, PreferenceType } from '@prisma/client';
import { WeeklyEvent, WeeklySchedule } from './types';
import { PAIR_SLOTS } from '../timeSlots';
import { DataService } from '../interfaces';
import { HOURS_PER_PAIR } from '../constants';

const WEEKDAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
];

const MAX_RETRIES_PER_LESSON = 250;

/** Fisher–Yates shuffle */
function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateRandomWeeklySchedule(
  data: DataService,
): WeeklySchedule {
  const events: WeeklyEvent[] = [];
  const scheduleMap = createScheduleMap();

  const semesterWeeks = calculateSemesterWeeks(
    data.semesters[0].start_date,
    data.semesters[0].end_date,
  );

  const teachingAssignments = shuffle(data.teachingAssignments);

  /* ───────── 1‑й прохід ───────── */
  const leftovers: {
    ta: (typeof teachingAssignments)[number];
    lessonTypes: LessonType[];
    pairsPerWeek: number;
  }[] = [];

  teachingAssignments.forEach((ta) => {
    const group   = data.studentGroups.find((g) => g.id === ta.group_id);
    const subject = data.subjects.find((s) => s.id === ta.subject_id);
    const teacher = data.teachers.find((t) => t.id === ta.teacher_id);
    if (!group || !subject || !teacher) return;

    const lessonTypes: LessonType[] = [];
    if (ta.lecture_hours_per_semester)  lessonTypes.push('lecture');
    if (ta.practice_hours_per_semester) lessonTypes.push('practice');
    if (ta.lab_hours_per_semester)      lessonTypes.push('lab');
    if (ta.seminar_hours_per_semester)  lessonTypes.push('seminar');

    lessonTypes.forEach((lt) => {
      const requiredHours =
        lt === 'lecture'  ? ta.lecture_hours_per_semester  :
          lt === 'practice' ? ta.practice_hours_per_semester :
            lt === 'lab'      ? ta.lab_hours_per_semester      :
              ta.seminar_hours_per_semester;

      if (!requiredHours) return;

      const totalPairs   = Math.ceil(requiredHours / HOURS_PER_PAIR);

      let pairsPerWeek = Math.floor(totalPairs / semesterWeeks);

      if (pairsPerWeek === 0 && totalPairs > 0) pairsPerWeek = 1;

      let placedPairs = 0;
      let attempts    = 0;

      while (placedPairs < pairsPerWeek && attempts < MAX_RETRIES_PER_LESSON) {
        attempts++;

        const dayOfWeek = WEEKDAYS[Math.floor(Math.random() * WEEKDAYS.length)];
        const pairIdx   = Math.floor(Math.random() * PAIR_SLOTS.length);

        const suitableRooms = data.classrooms.filter(
          (c) => c.capacity >= group.students_count,
        );
        if (!suitableRooms.length) break;
        const classroom =
          suitableRooms[Math.floor(Math.random() * suitableRooms.length)];

        const candidate: WeeklyEvent = {
          title:       subject.name,
          dayOfWeek,
          timeSlot:    pairIdx,
          groupId:     group.id,
          teacherId:   teacher.id,
          subjectId:   subject.id,
          classroomId: classroom.id,
          lessonType:  lt,
        };

        if (!hasConflict(candidate, scheduleMap)) {
          events.push(candidate);
          updateScheduleMap(candidate, scheduleMap);
          placedPairs++;
        } else {
          const alt = findAlternativeEvent(candidate, scheduleMap, data);
          if (alt) {
            events.push(alt);
            updateScheduleMap(alt, scheduleMap);
            placedPairs++;
          }
        }
      }

      if (placedPairs < pairsPerWeek) {
        leftovers.push({ ta, lessonTypes: [lt], pairsPerWeek: pairsPerWeek - placedPairs });
      }
    });
  });

  // ───────── 2‑й прохід: пробуємо дорозставити «хвости» ─────────
  leftovers.forEach(({ ta, lessonTypes, pairsPerWeek }) => {
    const group = data.studentGroups.find((g) => g.id === ta.group_id);
    const subject = data.subjects.find((s) => s.id === ta.subject_id);
    const teacher = data.teachers.find((t) => t.id === ta.teacher_id);
    if (!group || !subject || !teacher) return;

    const suitableRooms = data.classrooms
      .filter((c) => c.capacity >= group.students_count)
      .sort((a, b) => a.capacity - b.capacity);

    let placed = 0;
    let attempts = 0;

    while (placed < pairsPerWeek && attempts < MAX_RETRIES_PER_LESSON) {
      attempts++;

      for (const dayOfWeek of WEEKDAYS) {
        for (let pairIdx = 0; pairIdx < PAIR_SLOTS.length; pairIdx++) {
          for (const classroom of suitableRooms) {
            const candidate: WeeklyEvent = {
              title: subject.name,
              dayOfWeek,
              timeSlot: pairIdx,
              groupId: group.id,
              teacherId: teacher.id,
              subjectId: subject.id,
              classroomId: classroom.id,
              lessonType: lessonTypes[0], // тут лише один lt
            };

            if (!hasConflict(candidate, scheduleMap)) {
              events.push(candidate);
              updateScheduleMap(candidate, scheduleMap);
              placed++;
              if (placed >= pairsPerWeek) break;
            }
          }
          if (placed >= pairsPerWeek) break;
        }
        if (placed >= pairsPerWeek) break;
      }
    }
  });

  return { events };
}

export function createScheduleMap() {
  return {
    teacherSchedule: new Map<string, boolean>(),
    groupSchedule: new Map<string, boolean>(),
    classroomSchedule: new Map<string, boolean>(),
  };
}

/**
 * We treat timeSlot as 0..3.
 * So conflict = same teacher-group-classroom in same dayOfWeek + pairIndex
 */
function hasConflict(event: WeeklyEvent, scheduleMap): boolean {
  const key = `${event.dayOfWeek}-${event.timeSlot}`;
  const teacherKey = `T-${event.teacherId}-${key}`;
  const groupKey = `G-${event.groupId}-${key}`;
  const classroomKey = `C-${event.classroomId}-${key}`;

  if (
    scheduleMap.teacherSchedule.has(teacherKey) ||
    scheduleMap.groupSchedule.has(groupKey) ||
    scheduleMap.classroomSchedule.has(classroomKey)
  ) {
    return true;
  }
  return false;
}

export function updateScheduleMap(event: WeeklyEvent, scheduleMap) {
  const key = `${event.dayOfWeek}-${event.timeSlot}`;
  scheduleMap.teacherSchedule.set(`T-${event.teacherId}-${key}`, true);
  scheduleMap.groupSchedule.set(`G-${event.groupId}-${key}`, true);
  scheduleMap.classroomSchedule.set(`C-${event.classroomId}-${key}`, true);
}

export function calculateSemesterWeeks(startDate: Date, endDate: Date): number {
  const msInWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.ceil((endDate.getTime() - startDate.getTime()) / msInWeek);
}

export function findAlternativeEvent(
  event: WeeklyEvent,
  map,
  data: DataService,
): WeeklyEvent | null {
  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

  const group = data.studentGroups.find((g) => g.id === event.groupId);
  if (!group) return null;

  const rooms = data.classrooms
    .filter((c) => c.capacity >= group.students_count)
    .sort((a, b) => a.capacity - b.capacity);

  for (const day of WEEKDAYS) {
    const forbidden = data.teacherPreferences.some(
      (p) =>
        p.teacher_id      === event.teacherId &&
        p.day_of_week     === day             &&
        p.time_slot_index === event.timeSlot  &&
        p.preference      === PreferenceType.REQUIRED_FREE,
    );
    if (forbidden) continue;

    for (let pairIdx = 0; pairIdx < PAIR_SLOTS.length; pairIdx++) {
      const k = `${day}-${pairIdx}`;

      // зайнятість викладача чи групи
      if (
        map.teacherSchedule.has(`T-${event.teacherId}-${k}`) ||
        map.groupSchedule.has(`G-${event.groupId}-${k}`)
      ) continue;

      // підбираємо першу вільну аудиторію
      for (const room of rooms) {
        if (map.classroomSchedule.has(`C-${room.id}-${k}`)) continue;

        return {
          ...event,
          dayOfWeek:   day,
          timeSlot:    pairIdx,
          classroomId: room.id,
        };
      }
    }
  }
  return null;   // альтернативи не знайдено
}
