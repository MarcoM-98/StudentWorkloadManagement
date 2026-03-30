import express from 'express';
import {
    createAssignment,
    getAssignments,
    getAssignmentById,
    updateAssignment,
    deleteAssignment
} from '../mongodb-mongoose/assignmentService.js';

const router = express.Router();

// Validation Middleware
function validateAssignment(req, res, next) {
    const { title, dueDate, course, priority } = req.body;

    if (!title || !dueDate || !course || !priority) {
        return res.status(400).json({
            message: 'Missing required assignment fields',
        });
    }

    next();
}

// CREATE
router.post('/', validateAssignment, async (req, res) => {
    try {
        const assignment = await createAssignment({
            ...req.body,
            userId: req.user._id,
        });
        res.status(201).json(assignment);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// READ (all)
router.get('/', async (req, res) => {
    try {
        const assignments = await getAssignments(req.user._id);
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// READ (one)
router.get('/:id', async (req, res) => {
    try {
        const assignment = await getAssignmentById(req.user._id, Number(req.params.id));

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        res.json(assignment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE
router.put('/:id', validateAssignment, async (req, res) => {
    try {
        const assignment = await updateAssignment(
            req.user._id,
            Number(req.params.id),
            req.body
        );

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        res.json(assignment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH
router.patch('/:id/complete', async (req, res) => {
    try {
        const assignment = await updateAssignment(
            req.user._id,
            Number(req.params.id),
            { completed: true }
        );

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        res.json(assignment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const result = await deleteAssignment(
            req.user._id,
            Number(req.params.id)
        );

        if (!result) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        res.json({ message: 'Assignment deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
