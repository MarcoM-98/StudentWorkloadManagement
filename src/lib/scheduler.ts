export // interface for the assignments 
{
  id: string; // id of the assignment/hw
  title: string; // title of the assignment/hw
  duration_inMinutess: number; // duration in minutes to complete the assignment
  dueDate: Date; // due date for assignments
  status: 'todo' | 'in-progress' | 'done'; // status of the assignment to let the user know if it's completed or not
}

export // interface ScheduledPlan 
{
  sortedAssignments: Assignment[]; // assignments sorted by priority
  Time_ToComplete: number; // total time required
  TaskOverloaded: boolean; // if the total time required is greater than the available time
}

export const PlanGenerator 
= ( // function to generate the plan
  assignments: Assignment[],  // array of assignments
  AvailableTime: number // available time in minutes
): ScheduledPlan => { // return the plan
  const currentDate = new Date(); // current date

 // Add a filter to score the assignments to know their priority 
 // SCRUM-26 workload calculation for the assignments and availability for breaks
 const totalTime = activeAssignments.reduce((acc, curr) => acc + curr.duration_inMinutess, 0); // calculates total minutes of hw left to do
 
  return {
    // return the sorted assignments 
    Time_ToComplete: totalTime, // return the total time required
    TaskOverloaded: totalTime > AvailableTime // return if the user is overloaded or not
  };
};