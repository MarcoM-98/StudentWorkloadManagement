// src/lib/overload.ts
import { Assignment, Availability, OverloadResult } from "./types";

const WINDOW_DAYS = 7;

function clampNumber(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function toISODateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysLocal(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function computeOverload(
  assignments: Assignment[],
  availability: Availability | null,
  now: Date = new Date()
): OverloadResult {
  // Required hours = sum estimatedHours for TODO + IN_PROGRESS items
  let required = 0;

  for (const a of assignments) {
    if (a.status !== "TODO" && a.status !== "IN_PROGRESS") continue;

    const hrsRaw = typeof a.estimatedHours === "number" ? a.estimatedHours : 0;
    if (!Number.isFinite(hrsRaw) || hrsRaw < 0) continue;

    const hrs = clampNumber(hrsRaw, 0, 100);
    required += hrs;
  }

  // Sprint 1: fixed 7-day window => availableHours equals hoursPerWeek
  const hoursPerWeek = availability?.hoursPerWeek ?? 0;
  const available = clampNumber(hoursPerWeek, 0, 80);

  const overload = Math.max(0, required - available);

  const windowStart = toISODateOnly(now);
  const windowEnd = toISODateOnly(addDaysLocal(now, WINDOW_DAYS - 1));

  return {
    requiredHours: round1(required),
    availableHours: round1(available),
    overloadHours: round1(overload),
    isOverloaded: required > available,
    windowStart,
    windowEnd,
  };
}
