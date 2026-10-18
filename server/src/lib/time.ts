import { DateTime } from 'luxon';

export const TUNIS = 'Africa/Tunis';

export interface OpeningHourRow {
  weekday: number;
  openMinute: number | null;
  closeMinute: number | null;
}

export interface ExistingBooking {
  startAt: Date;
  endAt: Date;
}

export interface GeneratedSlot {
  startIso: string; // UTC ISO
  label: string; // HH:mm local
  available: boolean;
}

/** Convert a local (Africa/Tunis) date + minutes-from-midnight to a UTC Date. */
export function localToUtc(dateLocal: string, minutes: number): Date {
  const [y, m, d] = dateLocal.split('-').map((n) => parseInt(n, 10));
  const dt = DateTime.fromObject(
    { year: y, month: m, day: d, hour: Math.floor(minutes / 60), minute: minutes % 60 },
    { zone: TUNIS },
  );
  return dt.toUTC().toJSDate();
}

export function minutesLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Weekday (0=Sun..6=Sat) for a local yyyy-mm-dd in Tunis. */
export function weekdayOf(dateLocal: string): number {
  const [y, m, d] = dateLocal.split('-').map((n) => parseInt(n, 10));
  const dt = DateTime.fromObject({ year: y, month: m, day: d }, { zone: TUNIS });
  // luxon weekday: 1=Mon..7=Sun -> convert to 0=Sun..6=Sat
  return dt.weekday % 7;
}

export function todayLocalDate(): string {
  return DateTime.now().setZone(TUNIS).toFormat('yyyy-MM-dd');
}

/** The next N local dates starting today (yyyy-mm-dd). */
export function upcomingDates(count: number): string[] {
  const start = DateTime.now().setZone(TUNIS).startOf('day');
  return Array.from({ length: count }, (_, i) =>
    start.plus({ days: i }).toFormat('yyyy-MM-dd'),
  );
}

/**
 * Generate bookable slots for a business on a local date.
 * - Respects opening hours and a closed schedule-exception.
 * - A slot is unavailable if it is in the past or if the number of overlapping
 *   active bookings has reached the business capacity.
 */
export function generateSlots(opts: {
  dateLocal: string;
  durationMin: number;
  stepMin: number;
  capacity: number;
  hours: OpeningHourRow[];
  exceptionClosed: boolean;
  bookings: ExistingBooking[];
  now?: Date;
}): GeneratedSlot[] {
  const { dateLocal, durationMin, stepMin, capacity, hours, exceptionClosed, bookings } = opts;
  const now = opts.now ?? new Date();
  if (exceptionClosed) return [];

  const weekday = weekdayOf(dateLocal);
  const row = hours.find((h) => h.weekday === weekday);
  if (!row || row.openMinute == null || row.closeMinute == null) return [];

  const slots: GeneratedSlot[] = [];
  for (
    let start = row.openMinute;
    start + durationMin <= row.closeMinute;
    start += stepMin
  ) {
    const startUtc = localToUtc(dateLocal, start);
    const endUtc = localToUtc(dateLocal, start + durationMin);
    const overlapping = bookings.filter(
      (b) => b.startAt < endUtc && b.endAt > startUtc,
    ).length;
    const inFuture = startUtc.getTime() > now.getTime();
    slots.push({
      startIso: startUtc.toISOString(),
      label: minutesLabel(start),
      available: inFuture && overlapping < capacity,
    });
  }
  return slots;
}

/** Indicative "next open" label for business cards (opening-hours based). */
export function nextOpenLabel(hours: OpeningHourRow[], now?: Date): string | null {
  const base = DateTime.fromJSDate(now ?? new Date()).setZone(TUNIS);
  for (let i = 0; i < 7; i++) {
    const day = base.plus({ days: i });
    const weekday = day.weekday % 7;
    const row = hours.find((h) => h.weekday === weekday);
    if (!row || row.openMinute == null) continue;
    const openDt = day.startOf('day').plus({ minutes: row.openMinute });
    if (i === 0 && openDt < base) {
      // still open or already passed today; if close hasn't passed, it's "today"
      if (row.closeMinute != null) {
        const closeDt = day.startOf('day').plus({ minutes: row.closeMinute });
        if (base < closeDt) return "Aujourd'hui";
      }
      continue;
    }
    if (i === 0) return `Aujourd'hui ${minutesLabel(row.openMinute)}`;
    if (i === 1) return `Demain ${minutesLabel(row.openMinute)}`;
    return day.toFormat('ccc') + ` ${minutesLabel(row.openMinute)}`;
  }
  return null;
}
