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

// Unit Test 1 
  test("calculatePriority evaluates custom percentages over text keywords", () => {
    expect(calculatePriority("low", 85)).toBe(85);
    expect(calculatePriority("IMMEDIATE", null)).toBe(100);
    expect(calculatePriority("medium")).toBe(50);
  });

  // Unit Test 2
  test("suggestNewSchedule detects overload and returns delayed suggestions", () => {
    const mockTasks = [
      { _id: "1", title: "CS3398 Project", duration: 200, dueDate: "2026-04-25" },
      { _id: "2", title: "Compiler Construction", duration: 150, dueDate: "2026-04-25" }
    ];
    const dailyLimit = 300; 

    const results = suggestNewSchedule(mockTasks as any, dailyLimit);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("suggestedDate");
  });
  