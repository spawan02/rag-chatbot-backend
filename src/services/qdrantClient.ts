import { QdrantClient } from "@qdrant/js-client-rest";
import { Passage } from "../types/passage";
import { QDRANT_URL, QDRANT_API_KEY } from "../config";

const collectionName = "news";

function createClient() {
    return new QdrantClient({
        url: QDRANT_URL,
        apiKey: QDRANT_API_KEY,
    });
}

export async function createCollection() {
    const client = createClient();
    try {
        const collections = await client.getCollections();
        const exists = collections.collections.some(
            (c) => c.name === collectionName
        );
        if (!exists) {
            await client.createCollection(collectionName, {
                vectors: { size: 768, distance: "Cosine" },
            });
        }
    } catch (error: any) {
        console.log(
            "Collection already exists or error creating:",
            error.message
        );
    }
}

export async function storePassages(passages: Passage[]) {
    const client = createClient();

    const points = passages.map((p) => ({
        id: p.id,
        vector: p.embedding,
        payload: { text: p.text },
    }));

    await client.upsert(collectionName, { points });

    console.log(`Stored ${passages.length} points in Qdrant`);
}

export async function searchCollection(
    collectionName: string,
    vector: number[],
    limit = 5
) {
    const client = createClient();
    return await client.search(collectionName, {
        vector,
        limit,
    });
}
