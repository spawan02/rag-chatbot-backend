import { JINA_API_KEY } from "../config";
import axios from "axios";

export async function embedText(texts: string[]): Promise<number[][]> {
    try {
        const response = await axios.post<{ data: { embedding: number[] }[] }>(
            "https://api.jina.ai/v1/embeddings",
            {
                input: texts.map((text) => ({ text })),
                model: "jina-embeddings-v2-base-en",
            },
            { headers: { Authorization: `Bearer ${JINA_API_KEY}` } }
        );
        return response.data.data.map((item: any) => item.embedding);
    } catch (error) {
        console.error("Embedding error:", error);
        return [];
    }
}
