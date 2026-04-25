# Sprint Unit Test Plan

## Framework
Jest

## Team Members
- Kyle Kronk
- Kacin Segovia
- Marco Mosqueda
- Isabel Garcia

---

# Kyle Kronk

## Feature to Test
Assignment Upload and Analyze Pipeline

## Planned Tests
1. TXT upload/analyze returns valid assignment data  
2. PDF upload/analyze accepts file and returns parsed data  
3. DOCX upload/analyze accepts file and returns parsed data  

## Code Areas
- /api/upload
- /api/analyze
- file parsing helpers

## Expected Return Objects
- success
- filename
- title
- duration
- dueDate
- keywords
- isActionable

---

# Kacin Segovia

## Feature to Test
[Fill in feature]

## Planned Tests
1. [Test 1]  
2. [Test 2]  
3. [Test 3]

## Code Areas
- [File / API / Component]

## Expected Return Objects
- [Fields checked]

---

# Marco Mosqueda

## Feature to Test
Workload Calculation, Priority Logic, and Rescheduler Engine

## Planned Tests
1. calculatePriority logic evaluates custom percentages over text keywords and falls back to standardized integers. 
2. suggestNewSchedule detects when an array of tasks exceeds the dailyStudyMinutes limit and generates delayed suggestions.  
3. Priority sorting algorithm correctly sorts an unordered array of tasks dynamically in descending order.

## Code Areas
- src/lib/rescheduler.ts
- Priority Logic Utility / Derived State Sorting
- src/app/page.tsx (Logic layer)

## Expected Return Objects
- Priority value (Integer: 100, 50, 20, or custom)
- Array of scheduleSuggestions objects (containing isDelayed, isCritical, and suggestedDate)
- Sorted Array of Task objects

---

# Isabel Garcia

## Feature to Test
[Fill in feature]

## Planned Tests
1. [Test 1]  
2. [Test 2]  
3. [Test 3]

## Code Areas
- [File / API / Component]

## Expected Return Objects
- [Fields checked]