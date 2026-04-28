import mongoose from 'mongoose';
const { Schema } = mongoose;

const userSettingSchema = new Schema(
    {
        userId: {
            type: String,
            required: true
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
        },
        university: { 
            type: String, 
            default: "Texas State University" }, // we can change this to default -> required: true later if we implement a profile for each student and they can add their major 
        major: { 
            type: String, 
            default: "Undeclared" },// we can change this to default -> required: true

    },
    {
        timestamps: true,
        versionKey: false
    }
);
userSettingSchema.index({ userId: 1 }, { unique: true });
const UserSetting = mongoose.models.UserSetting || mongoose.model("UserSetting", userSettingSchema);

export default UserSetting
