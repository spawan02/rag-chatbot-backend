import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../config";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
export const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
