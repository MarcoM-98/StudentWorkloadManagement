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
  
 let currentDay = new Date(); // time/date of today
  let minutesUsedToday = 0; 
  const suggestions: Suggestion[] = []; 

  for (const task of sortedTasks) {
    const currentHour = currentDay.getHours();

    
    if (minutesUsedToday + task.duration > dailyMinutesMax || currentHour >= 22) { // Check if daily time is full OR if it's getting too late in the day ( made it past 10 PM / 22:00)
                                                                                // can switch to a different time we can agree on ?
      currentDay.setDate(currentDay.getDate() + 1);
      currentDay.setHours(9, 0, 0, 0); // Start fresh at 9:00 AM tomorrow instead of midnight
                            // checks if the current hour is past 10 PM. If it is, or if the time limit is maxed out, it pushes the work to 9:00 AM the next day.
      minutesUsedToday = 0;
    }
    suggestions.push({
      _id: task._id, // identifies the assignment
      title: task.title,
      suggestedDate: new Date(currentDay).toISOString().split('T')[0], // This converts the "Date Pointer" into a clean, readable string. such as year, month, day

      isDelayed: new Date(currentDay) > new Date(task.dueDate) // this helps the UI show a "Late" warning that we can implement ?
      ,
      isCritical: false
    });
    
    const suggestedDateObj = new Date(currentDay);
    const dueDateObj = new Date(task.dueDate);

    
    const timeDifference = dueDateObj.getTime() - suggestedDateObj.getTime(); // Calculate if it's due within 24 hours of our suggested date
    const isCritical = timeDifference >= 0 && timeDifference < (1000 * 60 * 60 * 24);

    suggestions.push({ // adds them to the end of our result list 
      _id: task._id, // identifies the assignment
      title: task.title,
      suggestedDate: suggestedDateObj.toISOString().split('T')[0], 
      isDelayed: suggestedDateObj > dueDateObj, 
      isCritical: isCritical  // this helps the UI show a "Late" warning
    });
    
    minutesUsedToday += task.duration; // adds the current assignment's minutes to the day's total so that the next assignment in the loop knows how much space is left in the day
  }
  
  return suggestions;
}