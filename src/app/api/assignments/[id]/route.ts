import { NextResponse } from 'next/server'; // send data back to the browser
import { connectDB } from "../../../../../mongodb-mongoose/db.js"; 
import Assignment from "../../../../../mongodb-mongoose/model/Assignment.js";
export async function PATCH( // will only run when you send a patch request
                            // allows you to modify specific fields of a data object without requiring or replacing the entire resource such as only specific data
  request: Request, // has the data being sent from AssignmentCard
  { params }: { params: Promise< { id: string }> } // next.js grabs the ID from the url and puts it here to know which card to update
) {
try {
    await connectDB(); // Ensure we are connected
    const { id } = await params; // Destructures the specific assignment ID from the URL parameters
    const body = await request.json(); // Parses the incoming "envelope" of data into a readable JavaScript object (the editData)

    
    const updatedAssignment = await Assignment.findByIdAndUpdate( // // Find the assignment by ID and update it with the new data from editData
      id,
      { $set: body }, // Only update the fields provided (title, duration, etc.)
      { new: true, runValidators: true } // Return the updated doc and check schema rules from our files like scheduler and Assignment
    );

    if (!updatedAssignment) { // If Mongoose can't find a document with that specific ID
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 }); // then return a 404 error
    }

    return NextResponse.json(updatedAssignment, { status: 200 }); //  Returns the updated assignment and a 200 (OK) status
  } catch (error: any) { // If any line inside the "try" block crashes (e.g., database goes offline)...
    console.error("Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
