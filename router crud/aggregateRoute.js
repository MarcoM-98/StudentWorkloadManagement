import express from "express";
import mongoose from "mongoose";

import assignmentRoutes from "./router crud/AssignmentRoute.js";
import userSettingsRoutes from "./router crud/userSettingsRoute.js";

const app = express();

app.use(express.json());

// Hook routes
app.use("/api/assignments", assignmentRoutes);
app.use("/api/settings", userSettingsRoutes);

mongoose.connect("your_connection_string")
    .then(() => {
        console.log("MongoDB connected");

        app.listen(3000, () => {
            console.log("Server running on port 3000");
        });
    })
    .catch(err => console.error(err));