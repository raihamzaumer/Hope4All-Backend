import express from "express";
import {
  createTask,
  getTasksByVolunteer,
  getAllTasks,
  updateTaskStatus,
  getVolunteerStats
} from "../controllers/taskController.js";

import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads/task_proofs directory exists
const uploadDir = 'uploads/task_proofs';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const router = express.Router();

// Create new task (admin)
router.post("/", createTask);

// Get tasks by volunteer
router.get("/volunteer/:volunteerId", getTasksByVolunteer);

// Get all tasks (admin)
router.get("/", getAllTasks);

// Update task status
router.put("/:taskId/status", upload.single('proofImage'), updateTaskStatus);

// Get volunteer stats
router.get("/stats/:volunteerId", getVolunteerStats);

export default router;
