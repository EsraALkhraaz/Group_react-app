// Availability = the teacher's weekly template minus slots already taken.
// Individual sessions block a slot entirely; group sessions block it only once the seats are full.

import { BOOKING_STATUS } from '../state/AppContext';

const BLOCKING = [
  BOOKING_STATUS.PENDING_APPROVAL,
  BOOKING_STATUS.AWAITING_PAYMENT,
  BOOKING_STATUS.PAYMENT_REVIEW,
  BOOKING_STATUS.CONFIRMED,
];

export const toISODate = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export function monthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const startPad = first.getDay(); // 0 = Sunday, matching the Arabic week start
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day));
  return cells;
}

export function slotsForDate(teacher, isoDate, bookings, sessionType) {
  const weekday = new Date(`${isoDate}T00:00:00`).getDay();
  const template = (teacher.availability && teacher.availability[weekday]) || [];

  return template.map((time) => {
    const onSlot = bookings.filter(
      (b) => b.teacherId === teacher.id && b.date === isoDate && b.time === time && BLOCKING.includes(b.status),
    );

    if (onSlot.length === 0) return { time, state: 'free', seatsTaken: 0 };

    const groupConfig = teacher.pricing?.online?.group || teacher.pricing?.f2f?.group;
    const allGroup = onSlot.every((b) => b.sessionType === 'group');

    if (sessionType === 'group' && allGroup && groupConfig) {
      const seatsTaken = onSlot.length;
      if (seatsTaken < groupConfig.maxSeats) {
        return { time, state: 'free', seatsTaken, maxSeats: groupConfig.maxSeats };
      }
      return { time, state: 'full', seatsTaken, maxSeats: groupConfig.maxSeats };
    }

    return { time, state: 'taken', seatsTaken: onSlot.length };
  });
}

export function hasAnySlot(teacher, isoDate, bookings, sessionType) {
  return slotsForDate(teacher, isoDate, bookings, sessionType).some((s) => s.state === 'free');
}

export function nextAvailableDates(teacher, bookings, sessionType, days = 45) {
  const out = [];
  const today = new Date();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const isoDate = toISODate(d);
    if (hasAnySlot(teacher, isoDate, bookings, sessionType)) out.push(isoDate);
  }
  return out;
}
