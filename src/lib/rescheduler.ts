export type Task = {// Every task must have these, we can add anything else thats missing 
  _id: string;
  title: string;
  duration: number;
  dueDate: string;
  priorityScore: number; 
};