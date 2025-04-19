// timeSlots.ts

export const TIME_SLOTS = [
  { index: 0, start: '08:40', end: '09:25' },
  { index: 1, start: '09:30', end: '10:15' },
  { index: 2, start: '10:35', end: '11:20' },
  { index: 3, start: '11:25', end: '12:10' },
  { index: 4, start: '12:20', end: '13:05' },
  { index: 5, start: '13:10', end: '13:55' },
  { index: 6, start: '14:05', end: '14:50' },
  { index: 7, start: '14:55', end: '15:40' },
];

// Pair 0 => timeslots 0,1
// Pair 1 => timeslots 2,3
// Pair 2 => timeslots 4,5
// Pair 3 => timeslots 6,7
export const PAIR_SLOTS = [
  {
    pairIndex: 0,
    startSlotIndex: 0,
    endSlotIndex: 1,
    start: '08:40',
    end: '10:15',  // covers TIME_SLOTS[0].start to TIME_SLOTS[1].end
  },
  {
    pairIndex: 1,
    startSlotIndex: 2,
    endSlotIndex: 3,
    start: '10:35',
    end: '12:10',  // covers TIME_SLOTS[2].start to TIME_SLOTS[3].end
  },
  {
    pairIndex: 2,
    startSlotIndex: 4,
    endSlotIndex: 5,
    start: '12:20',
    end: '13:55',  // covers TIME_SLOTS[4].start to TIME_SLOTS[5].end
  },
  {
    pairIndex: 3,
    startSlotIndex: 6,
    endSlotIndex: 7,
    start: '14:05',
    end: '15:40',  // covers TIME_SLOTS[6].start to TIME_SLOTS[7].end
  },
];
