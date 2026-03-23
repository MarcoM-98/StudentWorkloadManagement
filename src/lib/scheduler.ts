import Assignment from '@/mongodb-mongoose/model/Assignment';

type AssignmentDocument = InstanceType<typeof Assignment>;


export interface ScheduledPlan // SCRUM-46 interface to know what properties the object should have
{
  sortedAssignments: any[]; // assignments sorted by priority
  Time_ToComplete: number; // total time required
  TaskOverloaded: boolean; // if the total time required is greater than the available time
}

export const PlanGenerator = (assignments: AssignmentDocument[], AvailableTime: number): ScheduledPlan => {

// Goal is to ensure that completed work disappears from your calculations
// Scrum-43 work below
 const activeAssignments = assignments.filter(a => !a.completed); // filter out completed assignments


// Add a filter to score the assignments to know their priority 
 // Plan whenever something changes, such as a student finishing a task early or updating their study hours.
 // Filter to score the assignments to know their priority 
 // Scrum-38 work below
 
// SCRUM-38: Ordering Algorithm (Urgency + Effort)
  const scoredAssignments = activeAssignments.map(task => {
    // 1. Calculate Urgency (Time until deadline)
    const now = new Date().getTime();
    const due = new Date(task.dueDate).getTime();
    const hoursRemaining = Math.max((due - now) / (1000 * 60 * 60), 1);
    
    // Closer deadlines increase the score (Up to 60 point((if s due right now)))
    const urgencyScore = Math.max(0, 60 - (hoursRemaining / 2)); // Dividing by 2 means a task's urgency score
                                                                // drops to zero if it's due more than 120 hours (5 days) away.

    // 2. Priority Weighting (Up to 30 points, can change points later if we want urgency to be priority)
    const weights: Record<string, number> = { 'IMMEDIATE': 30, 'medium': 15, 'low': 5 };
    const priorityScore = weights[task.priority] || 5;

    // 3. Effort Factor (Longer duration tasks get higher priority within their tier)
    // Using 10 points for effort
    const effort = (task as any).duration_inMinutess || 60; // if task does not have a duration yet
                                                            // assume is 60 minutes
    const effortScore = Math.min(effort / 12, 10); // This prevents a massive ex.10-hour task from accidentally outranking a small but "IMMEDIATE" task.

    // Combined Total
    const combinedTotal = Math.round(urgencyScore + priorityScore + effortScore); // adds the urgency, priority and effort score

    return {
      ...task.toObject(), // Convert Mongoose doc to plain object leaving just title, date etc.
      priorityPercentage: Math.min(combinedTotal, 100) // Caps at 100%
    };
  });

  // sort by combined score = highest priority first
const sortedAssignments = scoredAssignments.sort((a, b) => b.priorityPercentage - a.priorityPercentage);

 // SCRUM-26 workload calculation for the assignments and availability for breaks
 // SCRUM-44: Calculate remaining time by subtracting minutesSpent from duration
 // SCRUM-45: Deadline detection system 
const totalTime = activeAssignments.reduce((acc, curr) => {
  const duration = curr.duration_inMinutess || 60;
  const spent = curr.minuteSpent || 0;
  const remaining = duration - spent;
  return acc + (remaining > 0 ? remaining : 0);

}, 0); // SCRUM 44
// SCRUM-26

 const isOverloaded = totalTime > (AvailableTime-30);

  return {
    // return the sorted assignments 
    sortedAssignments,
    Time_ToComplete: totalTime, // return the total time required
    TaskOverloaded: isOverloaded // return if the user is overloaded or not

  };
};