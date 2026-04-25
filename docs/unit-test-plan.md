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
<<<<<<< HEAD
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
=======
[Fill in feature]

## Planned Tests
1. [Test 1]  
2. [Test 2]  
3. [Test 3]

## Code Areas
- [File / API / Component]

## Expected Return Objects
- [Fields checked]

>>>>>>> origin/SCRUM-109-plan-unit-tests-for-assignment
---

# Marco Mosqueda

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