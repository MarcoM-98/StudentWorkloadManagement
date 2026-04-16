export type Task = {// Every task must have these, we can add anything else thats missing 
  _id: string;
  title: string;
  duration: number;
  dueDate: string;
  priorityPercentage: number; 
};

export type Suggestion = {
  _id: string;
  title: string;
  suggestedDate: string;
  isDelayed: boolean;
  isCritical: boolean;
};

export function suggestNewSchedule(tasks: Task[], dailyMinutesMax: number): Suggestion[] { // This uses the definition above to process the list.

const now = new Date().getTime();

  const sortedTasks = [...tasks].sort((a, b) => {   // Balance Priority vs. Urgency (Due Date)

    const aDaysLeft = Math.max(0, (new Date(a.dueDate).getTime() - now) / (1000 * 60 * 60 * 24));  // Calculate days left until the assignment is due 
    const bDaysLeft = Math.max(0, (new Date(b.dueDate).getTime() - now) / (1000 * 60 * 60 * 24)); // also converting milliseconds to day so we can get a good score by sorting

    
    
    const scoreA = a.priorityPercentage - (aDaysLeft * 5); //  High priority increases score, but having more days left decreases it.
    const scoreB = b.priorityPercentage - (bDaysLeft * 5); // The 5 is a multiplier. we can tweak it if due dates aren't pulling enough weight.

    return scoreB - scoreA; // Sort highest score to the top
  });
  
  const sortedTasks = [...tasks].sort((a, b) => b.priorityPercentage - a.priorityPercentage); // Sort by Priority Score/percentage so high-value work stays as early as possible ?

  let currentDay = new Date();
  currentDay.setHours(0, 0, 0, 0); // Reset time to midnight for clean math
  
  let minutesUsedToday = 0; // tracks how much time has been assigned that day if time reaches that then it moves to the next day to start the counter from 0 min again 
  const suggestions = []; // empty array that will store final(new) results/ date of the assignments

  for (const task of sortedTasks) {
    if (minutesUsedToday + task.duration > dailyMinutesMax) { // check if adding this task/assignment goes over the daily time limit if so, move it to tomorrow and reset the timer.
      currentDay.setDate(currentDay.getDate() + 1);
      minutesUsedToday = 0;
    }
    suggestions.push({ // adds them to the end of our result list which is the array in line 17 
      _id: task._id, // identifies the assignment
      title: task.title,
      suggestedDate: new Date(currentDay).toISOString().split('T')[0], // This converts the "Date Pointer" into a clean, readable string. such as year, month, day
       
      isDelayed: new Date(currentDay) > new Date(task.dueDate)  // this helps the UI show a "Late" warning that we can implement ?
    });
    
    minutesUsedToday += task.duration; // adds the current assignment's minutes to the day's total so that the next assignment in the loop knows how much space is left in the day
  }
  
  return suggestions;
}