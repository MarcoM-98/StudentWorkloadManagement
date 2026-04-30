import { NextResponse } from 'next/server'; // send data back to the browser
import { connectDB } from "../../../../../mongodb-mongoose/db.js"; 
import Assignment from "../../../../../mongodb-mongoose/model/Assignment.js";
import { requireFirebaseUserId } from "@/lib/requestUser";
export async function PATCH( // will only run when you send a patch request
                            // allows you to modify specific fields of a data object without requiring or replacing the entire resource such as only specific data
  request: Request, // has the data being sent from AssignmentCard
  { params }: { params: Promise< { id: string }> } // next.js grabs the ID from the url and puts it here to know which card to update
) {
try {
    const { userId, errorResponse } = requireFirebaseUserId(request);

    if (errorResponse) {
      return errorResponse;
    }

    await connectDB(); // Ensure we are connected
    const { id } = await params; // Destructures the specific assignment ID from the URL parameters
    const body = await request.json(); // Parses the incoming "envelope" of data into a readable JavaScript object (the editData)

    
    const updatedAssignment = await Assignment.findOneAndUpdate(
      { _id: id, userId },
      { $set: body }, // Only update the fields provided (title, duration, etc.)
      { new: true, runValidators: true } // Return the updated doc and check schema rules from our files like scheduler and Assignment
    );

    if (!updatedAssignment) { // If Mongoose can't find a document with that specific ID
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 }); // then return a 404 error
    }

    return NextResponse.json(updatedAssignment, { status: 200 }); //  Returns the updated assignment and a 200 (OK) status
  } catch (error: unknown) { // If any line inside the "try" block crashes (e.g., database goes offline)...
    console.error("Update Error:", error);
    const message = error instanceof Error ? error.message : "Failed to update assignment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, errorResponse } = requireFirebaseUserId(request);

    if (errorResponse) {
      return errorResponse;
    }

    await connectDB();
    const { id } = await params;

    const deletedAssignment = await Assignment.findOneAndDelete({ _id: id, userId });

    if (!deletedAssignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Assignment deleted" }, { status: 200 });
  } catch (error: unknown) {
    console.error("Delete Error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete assignment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
