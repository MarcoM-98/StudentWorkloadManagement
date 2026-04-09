import mongoose from 'mongoose';

export async function connectDB() {
    try {
        await mongoose.connect(
            'mongodb://localhost:27017/study_site'
        );
        console.log("MongoDB connected");
    } catch (err) {
        console.error("Connection error:", err);
        process.exit(1);
    }
}