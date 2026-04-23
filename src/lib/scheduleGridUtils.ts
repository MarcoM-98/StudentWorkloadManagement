import { type ScheduleBlock } from "@/lib/scheduleCollision";

export const HOUR_HEIGHT = 64;
export const MINUTE_HEIGHT = HOUR_HEIGHT / 60;
export const TOTAL_DAY_HEIGHT = 24 * HOUR_HEIGHT;
export const TIME_LABEL_WIDTH = 80;

export const DAILY_CAPACITY_MINUTES = 360; // 6 hours
export const WARNING_BUFFER_MINUTES = 60; // 1 hour over = yellow

export function getLocalStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatHeaderDate(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatHeaderDay(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function formatHourLabel(hour: number) {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

export function buildDays(startDate: Date, numberOfDays: number) {
  return Array.from({ length: numberOfDays }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getBlockTop(block: ScheduleBlock) {
  return (block.startHour * 60 + block.startMinute) * MINUTE_HEIGHT;
}

export function getBlockHeight(block: ScheduleBlock) {
  return Math.max(block.durationMinutes * MINUTE_HEIGHT, 24);
}

export function formatSingleTime(hour24: number, minutes: number) {
  const normalizedHour = hour24 % 24;
  const suffix = normalizedHour >= 12 ? "PM" : "AM";
  const hour12 =
    normalizedHour === 0 ? 12 : normalizedHour > 12 ? normalizedHour - 12 : normalizedHour;

  if (minutes === 0) {
    return `${hour12} ${suffix}`;
  }

  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatBlockTime(block: ScheduleBlock) {
  const startTotalMinutes = block.startHour * 60 + block.startMinute;
  const endTotalMinutes = startTotalMinutes + block.durationMinutes;

  const startHour = Math.floor(startTotalMinutes / 60);
  const startMinutes = startTotalMinutes % 60;
  const endHour = Math.floor(endTotalMinutes / 60);
  const endMinutes = endTotalMinutes % 60;

  return `${formatSingleTime(startHour, startMinutes)} - ${formatSingleTime(
    endHour,
    endMinutes
  )}`;
}

export function formatHoursOver(minutesOver: number) {
  return `+${(minutesOver / 60).toFixed(1)}h`;
}

export function getDayLoadStatus(totalMinutes: number) {
  if (totalMinutes <= DAILY_CAPACITY_MINUTES) {
    return {
      label: "OK",
      headerClass: "text-zinc-400",
      badgeClass: "bg-zinc-800 text-zinc-300 border-zinc-700",
      columnClass: "",
      borderClass: "border-zinc-800",
    };
  }

  if (totalMinutes <= DAILY_CAPACITY_MINUTES + WARNING_BUFFER_MINUTES) {
    return {
      label: formatHoursOver(totalMinutes - DAILY_CAPACITY_MINUTES),
      headerClass: "text-amber-300",
      badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      columnClass: "bg-amber-500/[0.05]",
      borderClass: "border-amber-500/30",
    };
  }

  return {
    label: formatHoursOver(totalMinutes - DAILY_CAPACITY_MINUTES),
    headerClass: "text-rose-300",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    columnClass: "bg-rose-500/[0.06]",
    borderClass: "border-rose-500/30",
  };
}