import dotenv from 'dotenv';
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

dotenv.config();

import assignmentRoutes from "./router crud/AssignmentRoute.js";
import userSettingsRoutes from "./router crud/userSettingsRoute.js";

const app = express();

app.use(express.json());
app.use(cors());

// Authentication middleware
app.use((req, res, next) => {
    // TODO: Implement actual authentication
    // For now, this is a placeholder that expects userId in headers or from session
    req.user = req.user || { _id: req.headers['user-id'] };
    next();
});

// Hook routes
app.use("/api/assignments", assignmentRoutes);
app.use("/api/settings", userSettingsRoutes);

const mongoURI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;

mongoose.connect(mongoURI)
    .then(() => {
        console.log("MongoDB connected");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => console.error(err));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal server error", message: err.message });
});

export default app;