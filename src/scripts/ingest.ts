import { ingestArticles } from "../services/rssIngest";
import { createCollection, storePassages } from "../services/qdrantClient";
import { v4 as uuidv4 } from "uuid";
import { chunkText } from "../utils/chunkText";
import { embedText } from "../services/embedder";
import { Passage } from "../types/passage";

async function processArticle(article: {
    title: string;
    content: string;
}): Promise<Passage[]> {
    const chunks = chunkText(article.content);

    const embeddings = await embedText(chunks);

    const passages: Passage[] = [];

    chunks.forEach((chunk, index) => {
        if (embeddings[index]) {
            passages.push({
                id: uuidv4(),
                text: `${article.title}: ${chunk}`,
                embedding: embeddings[index],
            });
        } else {
            console.log(`Skipping chunk ${index} for ${article.title} - no embedding`);
        }
    });

    return passages;
}

async function main() {
    const articles = await ingestArticles();
    await createCollection();
    const passagesArrays = await Promise.all(articles.map(processArticle));
    const passages = passagesArrays.flat();
    console.log(`Generated ${passages.length} embedded passages`);
    await storePassages(passages);
    console.log("Ingestion, chunking, embedding, and storage complete!");
}

main().catch((error) => console.error("Main error:", error));
