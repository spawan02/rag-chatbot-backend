export function chunkText(text: string, maxLength = 400): string[] {
    const words = text.split(" ");
    const chunks: string[] = [];
    let currentChunk = "";
    for (const word of words) {
        if (currentChunk.length + word.length > maxLength) {
            chunks.push(currentChunk.trim());
            currentChunk = word;
        } else {
            currentChunk += " " + word;
        }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
}
