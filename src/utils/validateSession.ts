import { RedisClientType } from "redis";

export async function validateSessionId(
    redisClient: RedisClientType,
    sessionId: string
): Promise<boolean> {
    if (!sessionId) return false;
    const exists = await redisClient.exists(sessionId);
    return exists === 1;
}
