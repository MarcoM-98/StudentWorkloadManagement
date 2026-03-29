import express from "express";
import {
    createUserSetting,
    getUserSettingByUserId,
    updateUserSetting,
    deleteUserSetting
} from "../services/userSettingsService.js";

const router = express.Router();


// POST /api/settings

router.post("/", async (req, res) => {
    try {
        const setting = await createUserSetting(req.body);
        res.status(201).json(setting);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// GET /api/settings/:userId

router.get("/:userId", async (req, res) => {
    try {
        const setting = await getUserSettingByUserId(req.params.userId);

        if (!setting) {
            return res.status(404).json({ message: "UserSetting not found" });
        }

        res.json(setting);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// PUT /api/settings/:userId

router.put("/:userId", async (req, res) => {
    try {
        const updated = await updateUserSetting(req.params.userId, req.body);

        if (!updated) {
            return res.status(404).json({ message: "UserSetting not found" });
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/settings/:userId

router.delete("/:userId", async (req, res) => {
    try {
        const result = await deleteUserSetting(req.params.userId);

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "UserSetting not found" });
        }

        res.json({ message: "UserSetting deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;