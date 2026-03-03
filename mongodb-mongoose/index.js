import mongoose from 'mongoose';
await mongoose.connect("mongodb+srv://xgc18:4tbYpyq1uXt5JasL@cluster0.it2tx.mongodb.net/?appName=Cluster0");

console.log("Connected to MongoDB");
import Assignment from './model/Assignment.js';


// Creates a new assignment and inserts it into database
const assignment = await Assignment.create({
    id: 1,
    title: 'Final Project',
    description: 'Complete the final project for the course',
    dueDate: new Date('2024-12-31'),
    course: 'CS 101',
    completed: false,
    priority: 'IMMEDIATE',
});

console.log('Created Assignment:', assignment);


// UPDATE: Marks the assignment as completed and updates the title
assignment.completed = true;
assignment.title = 'Final Project (Completed)';
await assignment.save();

console.log('Updated Assignment:', assignment);


// FIND: Finds an assignment by MongoDB ObjectId
/*
const assignmentFound = await Assignment.findById('<object id>').exec();
console.log('Found Assignment by ID:', assignmentFound);
*/


// FIND BY FIELD: Finds all assignments for a specific course
/*
const csAssignments = await Assignment.find({ course: 'CS 101' }).exec();
console.log('Assignments for CS 101:', csAssignments);
*/


// DELETE: Deletes one assignment by id
/*
const deletedAssignment = await Assignment.deleteOne({ id: 1 });
console.log('Deleted Assignment:', deletedAssignment);
*/