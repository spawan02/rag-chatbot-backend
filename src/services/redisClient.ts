import * as redis from "redis";
import { REDIS_HOSTNAME, REDIS_PORT, REDIS_PASSWORD } from "../config";

let client: redis.RedisClientType;

export async function getRedisClient(): Promise<redis.RedisClientType> {
    if (client) return client;

    client = redis.createClient({
        socket: {
            host: REDIS_HOSTNAME,
            port: REDIS_PORT,
            tls: true,
        },
        password: REDIS_PASSWORD,
    });

    client.on("error", (err) => console.error("Redis Client Error", err));

    await client.connect();
    console.log("Redis connected");
    return client;
}
