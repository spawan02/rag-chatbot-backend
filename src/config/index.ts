import dotenv from "dotenv";
dotenv.config();

export const QDRANT_URL = process.env.QDRANT_URL;
export const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
export const JINA_API_KEY = process.env.JINA_API_KEY;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const REDIS_HOSTNAME = process.env.REDISHOSTNAME;
export const REDIS_PASSWORD = process.env.REDISACCESSKEYS;
export const PORT = process.env.PORT ?? 8000;
export const REDIS_PORT = 6380;
