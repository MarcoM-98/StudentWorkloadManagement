export type Task = {// Every task must have these, we can add anything else thats missing 
  _id: string;
  title: string;
  duration: number;
  dueDate: string;
  priorityScore: number; 
};

export function suggestNewSchedule(tasks: Task[], dailyMinutesMax: number) { // This uses the definition above to process the list.
  
  const sortedTasks = [...tasks].sort((a, b) => b.priorityScore - a.priorityScore); // Sort by Priority Score so high-value work stays as early as possible ?

  let currentDay = new Date();
  currentDay.setHours(0, 0, 0, 0); // Reset time to midnight for clean math
  
  let minutesUsedToday = 0; // tracks how much time has been assigned that day if time reaches that then it moves to the next day to start the counter from 0 min again 
  const suggestions = []; // empty array that will store final(new) results/ date of the assignments

  for (const task of sortedTasks) {
    if (minutesUsedToday + task.duration > dailyMinutesMax) { // If the daily time is full, move the pointer to the next day
      currentDay.setDate(currentDay.getDate() + 1);
      minutesUsedToday = 0;
    }
    
  }
}