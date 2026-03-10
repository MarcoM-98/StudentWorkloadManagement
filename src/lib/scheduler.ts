export interface Assignments // SCRUM-46 interface to know what properties the object should have
{
  id: number; // id of the assignment/hw
  title: string; // title of the assignment/hw
  duration_inMinutess: number; // duration in minutes to complete the assignment
  dueDate: Date; // due date for assignments
  minuteSpent : number;// This will help us track how much work is done
  priority: 'low' | 'medium' | 'IMMEDIATE'; // status of the assignment to let the user know if it's completed or not
  completed: boolean;
}

export interface ScheduledPlan // SCRUM-46 interface to know what properties the object should have
{
  sortedAssignments: Assignments[]; // assignments sorted by priority
  Time_ToComplete: number; // total time required
  TaskOverloaded: boolean; // if the total time required is greater than the available time
}

export const PlanGenerator = (assignments: Assignments[], AvailableTime: number): ScheduledPlan => {

// Goal is to ensure that completed work disappears from your calculations
// Scrum-43 work below
 const activeAssignments = assignments.filter(a => !a.completed); // filter out completed assignments


// Add a filter to score the assignments to know their priority 
 // Plan whenever something changes, such as a student finishing a task early or updating their study hours.
 // Filter to score the assignments to know their priority 
 // Scrum-38 work below 
 
const sortedAssignments = [...activeAssignments].sort((a, b) => { // sort by due date, earlier due dates get higher priority 
    if (a.priority === 'IMMEDIATE' && b.status !== 'IMMEDIATE') return -1; // if a is in progress/immediate but b is not then put a first
    if (a.priority !== 'IMMEDIATE' && b.status === 'IMMEDIATE') return 1; // if a is not in progess/immediate but b is then put b first
    return 0;
                                                                         

});


 // SCRUM-26 workload calculation for the assignments and availability for breaks
 // SCRUM-44: Calculate remaining time by subtracting minutesSpent from duration
const totalTime = activeAssignments.reduce((acc, curr) => {
  const remaining = curr.duration_inMinutess - (curr.minutesSpent || 0);
  return acc + (remaining > 0 ? remaining : 0);

}, 0); // SCRUM 44
// SCRUM-26

 const isOverloaded = totalTime > (AvailableTime-30);

 return{
    sortedAssignments,
    Time_ToComplete: totalTime,
    TaskOverloaded: isOverloaded

    };
  return {
    // return the sorted assignments 
    sortedAssignments,
    Time_ToComplete: totalTime, // return the total time required
    TaskOverloaded: isOverloaded // return if the user is overloaded or not

  };
};