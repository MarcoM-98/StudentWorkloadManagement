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
Kyle Kronk – Unit Test Plan
1. Verify TXT, PDF, and DOCX files are accepted by upload form.
2. Verify upload action triggers API calls to upload and analyze routes.
3. Verify valid JSON analysis response populates assignment review fields correctly.

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
MongoDB Connection Responses, Mock MongoDB CRUD for Assignment Model, and Firebase OAuth Responses

## Planned Tests
1. MongoDB Connection returns valid GET/POST   
2. Create, Read, Update, and Delete, return correct insertion of objects from models for expected fields  
3. Valid token returns profile and invalid throws authentication error

## Code Areas
- mongodb-mongoose/db
- mongodb-mongoose/assignmentCLI
- react-firebase/src/authContext/index

## Expected Return Objects
- connect() returns non-null MongoClient
- createUser returns object with _id, along with getUserById(),updateUser() with correct field
- Returned objects are fields such as email and invalid token returns error response
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