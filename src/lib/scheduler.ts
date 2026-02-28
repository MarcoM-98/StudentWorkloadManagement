export interface Assignments // SCRUM-46 interface to know what properties the object should have
{
  id: string; // id of the assignment/hw
  title: string; // title of the assignment/hw
  duration_inMinutess: number; // duration in minutes to complete the assignment
  dueDate: Date; // due date for assignments
  minuteSpent : number;// This will help us track how much work is done
  status: 'todo' | 'in-progress' | 'done'; // status of the assignment to let the user know if it's completed or not
}

export interface ScheduledPlan // SCRUM-46 interface to know what properties the object should have
{
  sortedAssignments: Assignment[]; // assignments sorted by priority
  Time_ToComplete: number; // total time required
  TaskOverloaded: boolean; // if the total time required is greater than the available time
}

export const PlanGenerator = ( // function to generate the plan
  assignments: Assignment[],  // array of assignments
  AvailableTime: number // available time in minutes
): ScheduledPlan => { // return the plan
  const currentDate = new Date(); // current date

// Goal is to ensure that completed work disappears from your calculations
// Scrum-43 work below
 const activeAssignments = assignments.filter(a => a.status !== 'done'); // filter out completed assignments

 
 // Add a filter to score the assignments to know their priority 
 // Plan whenever something changes, such as a student finishing a task early or updating their study hours.
 // Filter to score the assignments to know their priority 

// Scrum-38 work below 
const sortedAssignments = [...activeAssignments].sort((a, b) => { // sort by due date, earlier due dates get higher priority 
    if (a.status === 'in-progress' && b.status !== 'in-progress') return -1; // if a is in progress but b is not then put a first
    if (a.status !== 'in-progress' && b.status === 'in-progress') return 1; // if a is not in progess but b is then put b first
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); // if due dates are the same, sort by duration,
                                                                         // shorter duration gets higher priority

 // SCRUM-26 workload calculation for the assignments and availability for breaks
 // SCRUM-44: Calculate remaining time by subtracting minutesSpent from duration
 // SCRUM-45: Deadline detection system 
const totalTime = activeAssignments.reduce((acc, curr) => {
  const remaining = curr.duration_inMinutess - (curr.minutesSpent || 0);
  return acc + (remaining > 0 ? remaining : 0);
}, 0); // SCRUM 44
// SCRUM-26
 const breakTime = 30; // make a 30 min break
 const workTime_final = AvailableTime - breakTime;

 const isOverloaded = totalTime > workTime_final; 
 


});
  return {
    // return the sorted assignments 
    sortedAssignments,
    Time_ToComplete: totalTime, // return the total time required
    TaskOverloaded: isOverloaded // return if the user is overloaded or not

  };
};