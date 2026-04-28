export type Task = {// Every task must have these, we can add anything else thats missing 
  _id: string;
  title: string;
  duration: number;
  dueDate: string;
  priorityPercentage: number; 
  customPercentage?: number | null;
};

export type Suggestion = {
  _id: string;
  title: string;
  suggestedDate: string;
  isDelayed: boolean;
  isCritical: boolean;
};
const toLocalYYYYMMDD = (date: Date) => { // Safe local date formatter to prevent timezone bug
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const getPriorityScore = (task: Task) => { // Helper to safely translate database words into a 0-100 number
    if (task.customPercentage !== null && task.customPercentage !== undefined) {
        return Number(task.customPercentage);
    }
    if (task.priority === "IMMEDIATE") return 100;
    if (task.priority === "medium") return 50;
    return 20; // "low" fallback
};

export function suggestNewSchedule(tasks: Task[], dailyMinutesMax: number): Suggestion[] { // This uses the definition above to process the list.

const now = new Date().getTime();
const maxDaily = dailyMinutesMax || 300; // Fallback to 5 hours (300 mins) if page.tsx forgets to send a limit

  const sortedTasks = [...tasks].sort((a, b) => {   // Balance Priority vs. Urgency (Due Date)

    const aDaysLeft = Math.max(0, (new Date(a.dueDate).getTime() - now) / (1000 * 60 * 60 * 24));  // Calculate days left until the assignment is due 
    const bDaysLeft = Math.max(0, (new Date(b.dueDate).getTime() - now) / (1000 * 60 * 60 * 24)); // also converting milliseconds to day so we can get a good score by sorting

    
    
    const scoreA = getPriorityScore(a) - (aDaysLeft * 5); //  High priority increases score, but having more days left decreases it.
    const scoreB = getPriorityScore(b) - (bDaysLeft * 5); // The 5 is a multiplier. we can tweak it if due dates aren't pulling enough weight.

    return scoreB - scoreA; // Sort highest score to the top
  });
  
 let currentDay = new Date(); // time/date of today
  let minutesUsedToday = 0; 
  const suggestions: Suggestion[] = []; 

  for (const task of sortedTasks) {
    const currentHour = currentDay.getHours();

    const safeDuration = Number(task.duration) || 60; // Force duration to be a strict Math Number to prevent String Concatenation
    if (minutesUsedToday > 0 && minutesUsedToday + safeDuration > maxDaily || currentHour >= 22) { // Check if daily time is full OR if it's getting too late in the day ( made it past 10 PM / 22:00)
                                                                                // can switch to a different time we can agree on ?
      currentDay.setDate(currentDay.getDate() + 1);
      currentDay.setHours(9, 0, 0, 0); // Start fresh at 9:00 AM tomorrow instead of midnight
                            // checks if the current hour is past 10 PM. If it is, or if the time limit is maxed out, it pushes the work to 9:00 AM the next day.
      minutesUsedToday = 0;
    }
    
    const dueDateObj = new Date(task.dueDate);

    
    const timeDifference = dueDateObj.getTime() - currentDay.getTime(); // Calculate if it's due within 24 hours of our suggested date
    const isCritical = timeDifference >= 0 && timeDifference < (1000 * 60 * 60 * 24);
    const assignedDateStr = toLocalYYYYMMDD(currentDay);
    const officialDueStr = task.dueDate.split('T')[0];

    suggestions.push({ // adds them to the end of our result list 
      _id: task._id, // identifies the assignment
      title: task.title,
      suggestedDate: assignedDateStr,
      isDelayed: assignedDateStr  > officialDueStr, 
      isCritical: isCritical  // this helps the UI show a "Late" warning
    });
    
    minutesUsedToday += safeDuration; // adds the current assignment's minutes to the day's total so that the next assignment in the loop knows how much space is left in the day
    currentDay.setMinutes(currentDay.getMinutes() + safeDuration);
    if (minutesUsedToday >= maxDaily) {
      // Instantly force a fresh day for whatever task is next in line
      currentDay.setDate(currentDay.getDate() + 1);
      currentDay.setHours(9, 0, 0, 0); 
      minutesUsedToday = 0;
    }
  }
  
  return suggestions;
}