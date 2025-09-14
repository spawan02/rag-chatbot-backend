import { Request, Response } from "express";
import * as chatService from "../services/chatService";

export const healthCheck = (req: Request, res: Response) => {
    res.json({ message: "server is healthy" });
};

export const startSession = async (req: Request, res: Response) => {
    try {
        const sessionId = await chatService.createSession();
        res.json({ sessionId });
    } catch (error) {
        console.error("Start session error:", error);
        res.status(500).json({ error: "Internal error" });
    }
};

export const getHistory = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.query;
        if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

        const history = await chatService.getHistory(sessionId as string);
        res.json(history);
    } catch (error) {
        console.error("Get history error:", error);
        res.status(500).json({ error: "Internal error" });
    }
};

export const resetSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

        await chatService.resetSession(sessionId);
        res.json({ message: "Session reset" });
    } catch (error) {
        console.error("Reset session error:", error);
        res.status(500).json({ error: "Internal error" });
    }
};

export const chat = async (req: Request, res: Response) => {
    try {
        const { sessionId, query } = req.body;
        if (!sessionId || !query)
            return res.status(400).json({ error: "Missing sessionId or query" });

        const answer = await chatService.processChat(sessionId, query);
        res.json({ answer });
    } catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({ error: "Internal error" });
    }
};
