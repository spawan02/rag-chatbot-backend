import axios from "axios";
import * as cheerio from "cheerio";

export async function fetchFullPageContent(url: string): Promise<string> {
    try {
        const response = await axios.get<string>(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });

        const $ = cheerio.load(response.data);
        const contentElements = $(
            '[data-component="text-block"] p, .article p, .story-body p'
        );

        let content = contentElements
            .map((i, el) => $(el).text().trim())
            .get()
            .join("\n\n");

        return content
            .replace(/\s+/g, " ")
            .replace(/(\n){3,}/g, "\n\n")
            .trim();
    } catch (error: any) {
        console.error(`Error fetching full page for ${url}:`, error.message);
        return "";
    }
}
