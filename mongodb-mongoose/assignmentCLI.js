import readline from 'readline';
import { connectDB } from "./db.js";
import {
    createAssignment,
    getAssignments,
    getAssignmentById,
    updateAssignment,
    deleteAssignment
} from "./assignmentService.js";

await connectDB();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function menu() {
    console.log(`
====== ASSIGNMENT CLI ======
1. Create Assignment
2. View All Assignments
3. View One Assignment
4. Update Assignment
5. Delete Assignment
6. Exit
============================
    `);

    rl.question("Choose an option: ", async (choice) => {

        switch (choice) {

            case '1':
                rl.question("UserId: ", (userId) => {
                    rl.question("Assignment ID (number): ", (id) => {
                        rl.question("Title: ", (title) => {
                            rl.question("Course: ", (course) => {
                                rl.question("Due Date (YYYY-MM-DD): ", async (dueDate) => {
                                    await createAssignment({
                                        userId,
                                        id: Number(id),
                                        title,
                                        course,
                                        dueDate: new Date(dueDate),
                                        priority: 'medium'
                                    });
                                    menu();
                                });
                            });
                        });
                    });
                });
                break;

            case '2':
                rl.question("UserId: ", async (userId) => {
                    await getAssignments(userId);
                    menu();
                });
                break;

            case '3':
                rl.question("UserId: ", (userId) => {
                    rl.question("Assignment ID: ", async (id) => {
                        await getAssignmentById(userId, Number(id));
                        menu();
                    });
                });
                break;

            case '4':
                rl.question("UserId: ", (userId) => {
                    rl.question("Assignment ID: ", (id) => {
                        rl.question("New Title: ", async (title) => {
                            await updateAssignment(userId, Number(id), {
                                title,
                                completed: true
                            });
                            menu();
                        });
                    });
                });
                break;

            case '5':
                rl.question("UserId: ", (userId) => {
                    rl.question("Assignment ID: ", async (id) => {
                        await deleteAssignment(userId, Number(id));
                        menu();
                    });
                });
                break;

            case '6':
                console.log("Exiting...");
                rl.close();
                process.exit(0);


            default:
                console.log("Invalid choice");
                menu();
        }
    });
}

menu();