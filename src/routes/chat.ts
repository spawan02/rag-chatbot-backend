import express from "express";
import { v4 as uuidv4 } from "uuid";
import { getRedisClient } from "../services/redisClient";
import { embedText } from "../services/embedder";
import { model } from "../services/genAI";
import { searchCollection } from "../services/qdrantClient";

const router = express.Router();

router.get("/health", (req, res) => {
    res.json({
        message: "server is healthy",
    });
});

router.post("/start-session", async (req, res) => {
    try {
        const redisClient = await getRedisClient();
        const sessionId = uuidv4();
        await redisClient.set(sessionId, JSON.stringify([]));
        await redisClient.expire(sessionId, 3600);
        res.json({ sessionId });
    } catch (error) {
        console.error("Start session error:", error);
        res.status(500).json({ error: "Internal error" });
    }
});

router.get("/history", async (req, res) => {
    try {
        const { sessionId } = req.query;
        if (!sessionId)
            return res.status(400).json({ error: "Missing sessionId" });

        const redisClient = await getRedisClient();
        const history = (await redisClient.get(sessionId as string)) || "[]";
        res.json(JSON.parse(history));
    } catch (error) {
        console.error("Get history error:", error);
        res.status(500).json({ error: "Internal error" });
    }
});

router.post("/reset-session", async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId)
            return res.status(400).json({ error: "Missing sessionId" });

        const redisClient = await getRedisClient();
        await redisClient.del(sessionId);
        res.json({ message: "Session reset" });
    } catch (error) {
        console.error("Reset session error:", error);
        res.status(500).json({ error: "Internal error" });
    }
});

router.post("/chat", async (req, res) => {
    try {
        const { sessionId, query } = req.body;
        if (!sessionId || !query)
            return res
                .status(400)
                .json({ error: "Missing sessionId or query" });

        const redisClient = await getRedisClient();
        const cacheKey = `cache:query:${query}`;
        const cachedAnswer = await redisClient.get(cacheKey);
        if (cachedAnswer) {
            const answer = JSON.parse(cachedAnswer);
            let history = JSON.parse(
                (await redisClient.get(sessionId)) || "[]"
            );
            history.push({ query, answer });
            await redisClient.set(sessionId, JSON.stringify(history));
            await redisClient.expire(sessionId, 3600);

            res.json({ answer });
            return;
        }
        const queryEmbeddingArr = await embedText([query]);
        const queryEmbedding = queryEmbeddingArr[0];
        if (queryEmbedding.length === 0)
            return res.status(500).json({ error: "Embedding failed" });

        const searchResult = await searchCollection("news", queryEmbedding, 5);

        const passages = searchResult
            .map((r) => {
                const text = r.payload?.text;
                return typeof text === "string" ? text.trim() : "";
            })
            .filter((p) => p.length > 0);

        let prompt: string;
        if (passages.length === 0) {
            prompt = `I'm sorry, I couldn't find any relevant information on that topic. Please ask something related to the news topics I have information about.`;
        } else {
            prompt = `Based on these news passages: ${passages.join(
                "\n\n"
            )}\nAnswer the query: ${query}`;
        }

        const result = await model.generateContent(prompt);
        const answer = result.response.text();
        await redisClient.set(cacheKey, JSON.stringify(answer), { EX: 300 });
        let history = JSON.parse((await redisClient.get(sessionId)) || "[]");
        history.push({ query, answer });

        await redisClient.set(sessionId, JSON.stringify(history));
        await redisClient.expire(sessionId, 3600);

        res.json({ answer });
    } catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({ error: "Internal error" });
    }
});

export default router;
