import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const userSettingSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },

        dailyStudyMinutes: {
            type: Number,
            required: true,
            default: 120,
            min: 0
        },

        studyDaysPerWeek: {
            type: Number,
            required: true,
            default: 5,
            min: 1,
            max: 7
        },

        breakDuration: {
            type: Number,
            required: true,
            default: 30
        },

        maxWeeklyWorkload: {
            type: Number,
            required: true,
            default: 600
        }

    },
    {
        timestamps: true,
        versionKey: false
    }
);