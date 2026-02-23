export interface Assignments // SCRUM-46 interface to know what properties the object should have
{
  id: string; // id of the assignment/hw
  title: string; // title of the assignment/hw
  duration_inMinutess: number; // duration in minutes to complete the assignment
  dueDate: Date; // due date for assignments
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
 const sortedAssignments = [...assignments].sort((a, b) => { // sort by due date, earlier due dates get higher priority 
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); // if due dates are the same, sort by duration,
                                                                         // shorter duration gets higher priority
  });

 const totalTime = activeAssignments.reduce((acc, curr) => acc + curr.duration_inMinutess, 0); // calculate total time required to complete all active assignments


// Plan whenever something changes, such as a student finishing a task early or updating their study hours.
// Scrum-38 work below



 
  return {
    // return the sorted assignments 
    sortedAssignments
    Time_ToComplete: totalTime, // return the total time required
    TaskOverloaded: totalTime > AvailableTime // return if the user is overloaded or not
  };
};