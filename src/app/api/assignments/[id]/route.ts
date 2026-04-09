import { nextResponse } from 'next/server'; // send data back to the browser
import dbConnect from '@/mongodb-mongoose/dbConnect';
import Assignment from '@/mongodb-mongoose/model/Assignment';

export async function PATCH( // will only run when you send a patch request
                            // allows you to modify specific fields of a data object without requiring or replacing the entire resource such as only specific data
  request: Request, // has the data being sent from AssignmentCard
  { params }: { params: { id: string } } // next.js grabs the ID from the url and puts it here to know which card to update
)
