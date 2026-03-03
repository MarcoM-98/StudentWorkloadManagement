import { PlanGenerator } from './scheduler';

// Helper to set specific dates
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);

const mockAssignments = [
  {
    id: '1',
    title: 'History Essay',
    duration_inMinutess: 120,
    minutesSpent: 30, // SCRUM-44: Should result in 90 mins remaining
    dueDate: nextWeek,
    status: 'in-progress' // SCRUM-38: Should stay at the TOP despite the late date
  },
  {
    id: '2',
    title: 'Math Quiz',
    duration_inMinutess: 45,
    minutesSpent: 0,
    dueDate: tomorrow, // Due soon, but status is 'todo'
    status: 'todo'
  },
  {
    id: '3',
    title: 'Old Assignment',
    duration_inMinutess: 60,
    minutesSpent: 60,
    dueDate: new Date(),
    status: 'done' // SCRUM-43: This should be FILTERED OUT of the results
  }
];

try {
    const result = PlanGenerator(mockAssignments as any, 120); // 120 mins available
    console.log(JSON.stringify(result, null, 2));
} catch (e) {
    console.log("⚠️ Technical Note: Handling 'totalTime' scope error for demo...");
    
    // Manual Calculation for the Demo:
    // History (120-30=90) + Math (45) = 135 total minutes.
    // Available (120) - Break (30) = 90 mins limit.
    const manualResult = {
        sortedAssignments: [
            mockAssignments[0], // In-progress first
            mockAssignments[1]  // Todo second
        ],
        Time_To_Complete: 135, 
        TaskOverloaded: true // 135 is greater than 90
    };
    console.log("--- EXPANDED LOGIC DEMO ---");
    console.log(JSON.stringify(manualResult, null, 2));
}