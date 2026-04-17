import mongoose from 'mongoose';

export async function connectDB() {
    try {
        await mongoose.connect(
            'mongodb+srv://REMOVED_CLUSTER_INFO'
        );
        console.log("MongoDB connected");
    } catch (err) {
        console.error("Connection error:", err);
        process.exit(1);
    }
}