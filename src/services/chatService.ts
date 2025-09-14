import { v4 as uuidv4 } from "uuid";
import { getRedisClient } from "./redisClient";
import { embedText } from "./embedder";
import { model } from "./genAI";
import { searchCollection } from "./qdrantClient";

const SESSION_TTL = 3600;
const CACHE_TTL = 300;

export const createSession = async (): Promise<string> => {
    const redisClient = await getRedisClient();
    const sessionId = uuidv4();
    await redisClient.set(sessionId, JSON.stringify([]));
    await redisClient.expire(sessionId, SESSION_TTL);
    return sessionId;
};

export const getHistory = async (sessionId: string): Promise<any[]> => {
    const redisClient = await getRedisClient();
    const history = await redisClient.get(sessionId);
    return history ? JSON.parse(history) : [];
};

export const resetSession = async (sessionId: string): Promise<void> => {
    const redisClient = await getRedisClient();
    await redisClient.del(sessionId);
};

export const processChat = async (
    sessionId: string,
    query: string
): Promise<string> => {
    const redisClient = await getRedisClient();
    const cacheKey = `cache:query:${query}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
        const answer = JSON.parse(cached);
        await appendToHistory(redisClient, sessionId, query, answer);
        return answer;
    }

    const [queryEmbedding] = await embedText([query]);

    if (!queryEmbedding || queryEmbedding.length === 0) {
        throw new Error("Embedding failed");
    }

    const results = await searchCollection("news", queryEmbedding, 5);
    const passages = results
        .map((r) =>
            typeof r.payload?.text === "string" ? r.payload.text.trim() : ""
        )
        .filter((text) => text.length > 0);

    let prompt: string;
    if (passages.length === 0) {
        prompt = `I'm sorry, I couldn't find any relevant information on that topic.`;
    } else {
        prompt = `Based on these news passages:\n\n${passages.join(
            "\n\n"
        )}\n\nAnswer the query: ${query}`;
    }

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    await redisClient.set(cacheKey, JSON.stringify(answer), { EX: CACHE_TTL });
    await appendToHistory(redisClient, sessionId, query, answer);

    return answer;
};

const appendToHistory = async (
    redisClient: any,
    sessionId: string,
    query: string,
    answer: string
) => {
    const history = JSON.parse((await redisClient.get(sessionId)) || "[]");
    history.push({ query, answer });
    await redisClient.set(sessionId, JSON.stringify(history));
    await redisClient.expire(sessionId, SESSION_TTL);
};
