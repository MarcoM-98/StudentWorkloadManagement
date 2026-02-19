export interface Assignment {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    course: string;
    completed: boolean;
    priority: "low" | "medium" | "IMMEDIATELY";
    createdAt: string;
    updatedAt: string;
}

let assignments: Assignment[] = [];
let nextId = 1;

export function getAll() {
    return assignments;
}

export function create(data: Omit<Assignment, "id" | "createdAt" | "updatedAt">) {
    const now = new Date().toISOString();
    const assignment: Assignment = {
        id: String(nextId++),
        createdAt: now,
        updatedAt: now,
        ...data
    };
    assignments.push(assignment);
    return assignment;
}

export function update(id: string, data: Partial<Assignment>) {
    const assignment = assignments.find(a => a.id === id);
    if (!assignment) return null;

    Object.assign(assignment, data, {
        updatedAt: new Date().toISOString()
    });

    return assignment;
}

export function remove(id: string) {
    const index = assignments.findIndex(a => a.id === id);
    if (index === -1) return false;

    assignments.splice(index, 1);
    return true;
}