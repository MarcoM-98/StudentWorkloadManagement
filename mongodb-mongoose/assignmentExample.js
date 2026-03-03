import mongoose from 'mongoose';
import Assignment from '../models/Assignment.js';

async function runExample() {
    try {
        // Connect to MongoDB
        await mongoose.connect(
            'mongodb+srv://REMOVED_CLUSTER_INFO'
        );
        console.log('Connected to MongoDB');

        // TEMP user id
        const userId = '000000000000000000000001';

        // CREATE
        const assignment = await Assignment.create({
            id: 1,
            userId,
            title: 'Final Project',
            description: 'Complete the final project for the course',
            dueDate: new Date('2024-12-31'),
            course: 'CS 101',
            completed: false,
            priority: 'IMMEDIATE',
        });

        console.log('Created Assignment:', assignment);

        // UPDATE
        assignment.completed = true;
        assignment.title = 'Final Project (Completed)';
        await assignment.save();

        console.log('Updated Assignment:', assignment);

        // READ by ObjectId
        const foundById = await Assignment.findById(assignment._id);
        console.log('Found Assignment by ObjectId:', foundById);

        // READ by field
        const csAssignments = await Assignment.find({
            course: 'CS 101',
            userId,
        });
        console.log('Assignments for CS 101:', csAssignments);

        // DELETE
        const deleted = await Assignment.deleteOne({
            id: 1,
            userId,
        });
        console.log('Deleted Assignment:', deleted);

    } catch (err) {
        console.error('Error running example:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

runExample();