// Import the functions 

import { suggestNewSchedule } from "../src/lib/rescheduler";

// implementation of the logic for the test file ---
const calculatePriority = (priorityWord: string, customNumber?: number | null) => {
  if (customNumber !== null && customNumber !== undefined) return customNumber; 
  if (priorityWord === "IMMEDIATE") return 100;
  if (priorityWord === "medium") return 50;
  if (priorityWord === "low") return 20;
  return 0; 
};

const sortTasksByPriority = (tasks: any[]) => {
  return [...tasks].sort((a, b) => {
    return calculatePriority(b.priority, b.customPercentage) - calculatePriority(a.priority, a.customPercentage);
  });
};