// utils/slots.ts
import { PAIR_SLOTS } from '../timeSlots';

/** Повертає два індекси тайм‑слотів, що утворюють пару */
export function pairToSlotIndices(pairIndex: number): [number, number] {
  const { startSlotIndex, endSlotIndex } = PAIR_SLOTS[pairIndex];
  return [startSlotIndex, endSlotIndex];
}
