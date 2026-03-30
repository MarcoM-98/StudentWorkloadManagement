
// pipeline.js

export const assignmentWithSettingsPipeline = (userId) => [
    {
        $match: { userId } // filter assignments by user
    },
    {
        $lookup: {
            from: "usersettings", // MUST match MongoDB collection name
            localField: "userId",
            foreignField: "userId",
            as: "settings"
        }
    },
    {
        $unwind: {
            path: "$settings",
            preserveNullAndEmptyArrays: true
        }
    },
    {
        $project: {
            title: 1,
            dueDate: 1,
            "settings.dailyStudyMinutes": 1,
            "settings.studyDaysPerWeek": 1,
            "settings.maxWeeklyWorkload": 1
        }
    }
];