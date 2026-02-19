// src/lib/types.ts

export type AssignmentStatus = "TODO" | "DONE";

export interface Assignment {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD (date-only)
  estimatedHours: number; // >= 0 (decimals allowed)
  status: AssignmentStatus;
}

export interface Availability {
  hoursPerWeek: number; // >= 0
}

export interface OverloadResult {
  requiredHours: number;
  availableHours: number;
  overloadHours: number;
  isOverloaded: boolean;
  windowStart: string; // YYYY-MM-DD
  windowEnd: string;   // YYYY-MM-DD
}
