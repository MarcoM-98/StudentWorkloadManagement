import Assignment from "./model/Assignment.js";

// CREATE
export async function createAssignment(data) {
    const existing = await Assignment.findOne({
        userId: data.userId,
        id: data.id
    });

    if (existing) {
        console.log("Assignment with this ID already exists for this user.");
        return existing;
    }

    const assignment = await Assignment.create(data);
    console.log("Created:", assignment);
    return assignment;
}

// READ ALL
export async function getAssignments(userId) {
    const assignments = await Assignment.find({ userId });

    console.log("Assignments:", assignments);
    return assignments;
}

// READ ONE
export async function getAssignmentById(userId, id) {
    const assignment = await Assignment.findOne({ userId, id });

    if (!assignment) {
        console.log("Assignment not found.");
        return null;
    }

    console.log("Found:", assignment);
    return assignment;
}

// UPDATE
export async function updateAssignment(userId, id, updates) {
    const updated = await Assignment.findOneAndUpdate(
        { userId, id },
        updates,
        { new: true, runValidators: true }
    );

    if (!updated) {
        console.log("Assignment not found.");
        return null;
    }

    console.log("Updated:", updated);
    return updated;
}

// DELETE
export async function deleteAssignment(userId, id) {
    const deleted = await Assignment.findOneAndDelete({ userId, id });

    if (!deleted) {
        console.log("Nothing to delete.");
        return null;
    }

    console.log("Deleted:", deleted);
    return deleted;
}