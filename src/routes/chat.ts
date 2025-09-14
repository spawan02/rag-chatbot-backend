import express from "express";
import * as chatController from "../controllers/chatController";

const router = express.Router();

router.get("/health", chatController.healthCheck);
router.post("/start-session", chatController.startSession);
router.get("/history", chatController.getHistory);
router.post("/reset-session", chatController.resetSession);
router.post("/chat", chatController.chat);

export default router;
