import express from 'express';
import Assignment from '../models/Assignment.js';

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
        const assignment = await Assignment.create({
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
    const assignments = await Assignment.find({
        userId: req.user._id,
    });
    res.json(assignments);
});

// READ (one)
router.get('/:id', async (req, res) => {
    const assignment = await Assignment.findOne({
        id: Number(req.params.id),
        userId: req.user._id,
    });

    if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
});

// UPDATE
router.put('/:id', validateAssignment, async (req, res) => {
    const assignment = await Assignment.findOneAndUpdate(
        { id: Number(req.params.id), userId: req.user._id },
        req.body,
        { new: true, runValidators: true }
    );

    if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
});

// PATCH
router.patch('/:id/complete', async (req, res) => {
    const assignment = await Assignment.findOneAndUpdate(
        { id: Number(req.params.id), userId: req.user._id },
        { completed: true },
        { new: true }
    );

    if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
});

// DELETE
router.delete('/:id', async (req, res) => {
    const result = await Assignment.deleteOne({
        id: Number(req.params.id),
        userId: req.user._id,
    });

    if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ message: 'Assignment deleted' });
});

export default router;
