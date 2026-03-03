// src/lib/store.ts
import { Assignment, Availability } from "./types";

// NOTE: This is in-memory only (resets when server restarts).
// Good enough for Sprint 1. Replace with DB later.

const assignments: Assignment[] = [];
let availability: Availability | null = { hoursPerWeek: 0 };

export function getAssignments(): Assignment[] {
  return assignments;
}

export function setAssignments(next: Assignment[]): void {
  assignments.length = 0;
  assignments.push(...next);
}

export function addAssignment(a: Assignment): void {
  assignments.push(a);
}

export function updateAssignment(id: string, patch: Partial<Assignment>): Assignment | null {
  const idx = assignments.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  assignments[idx] = { ...assignments[idx], ...patch };
  return assignments[idx];
}

export function deleteAssignment(id: string): boolean {
  const idx = assignments.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  assignments.splice(idx, 1);
  return true;
}

export function getAvailability(): Availability | null {
  return availability;
}

export function setAvailability(next: Availability): void {
  availability = next;
}
