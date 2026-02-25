import mongoose from 'mongoose';
const { Schema, model } = mongoose;


const assignmentSchema = new Schema(
    {
        id: {
            type: Number,
            required: true,
            min: 1,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        course: {
            type: String,
            required: true,
        },
        completed: {
            type: Boolean,
            required: true,
            default: false,
        },
        priority: {
            type: String,
            required: true,
            enum: ['low', 'medium', 'IMMEDIATE'],
        },
    },
    {
        timestamps: true, // creates createdAt and updatedAt automatically
        versionKey: false,
    }
);

const Assignment = model('Assignment', assignmentSchema);
export default Assignment;