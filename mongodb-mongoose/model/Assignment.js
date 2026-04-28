import mongoose from 'mongoose';
const { Schema, model } = mongoose;


const assignmentSchema = new Schema(
    {
        id: {
            type: Number,
            required: true,
            min: 1,
        },
        userId: {
            type: String,
            required: true
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
        customPercentage: {
            type: Number, 
            default: null,
            min: 0,
            max: 100
        },
        duration: {
             type: Number, 
             default: 0 },

        courseCode: { 
            type: String, 
            default: "" 
        }, // scraper will fill this
        keywords: { 
            type: [String], 
            default: [] 
        },
        isActionable: { 
            type: Boolean, 
            default: true 
        },
        plannedDate: {
            type: Date,
            default: null, // The Rescheduler's optimized date
        },
    },

    {
        timestamps: true, // creates createdAt and updatedAt automatically
        versionKey: false,
    }
);
assignmentSchema.index({ userId: 1, id: 1 }, { unique: true });
const Assignment = model('Assignment', assignmentSchema);
export default Assignment;