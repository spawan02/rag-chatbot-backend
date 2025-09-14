import Parser from "rss-parser";
import { fetchFullPageContent } from "./fetchContent";

interface Article {
    id: string;
    title: string;
    content: string;
}

const BBC_FEEDS = [
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://feeds.bbci.co.uk/news/business/rss.xml",
    "https://feeds.bbci.co.uk/news/technology/rss.xml",
    "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
];

const ARTICLE_LIMIT = 50;
const FETCH_FULL_PAGE = false;

function createArticle(item: any, title: string, content: string): Article {
    return {
        id: item.link || item.guid || "",
        title,
        content,
    };
}

async function processFeedItems(items: any[], articles: Article[]) {
    for (const item of items) {
        if (articles.length >= ARTICLE_LIMIT) break;
        const title = item.title || "No title";
        let content = item.contentSnippet || item.description || "";
        if (FETCH_FULL_PAGE && item.link) {
            content = await fetchFullPageContent(item.link);
        }
        if (content.length >= 100) continue;
        articles.push(createArticle(item, title, content));
    }
}

export async function ingestArticles(): Promise<Article[]> {
    const parser = new Parser();
    const articles: Article[] = [];

    for (const feedUrl of BBC_FEEDS) {
        if (articles.length >= ARTICLE_LIMIT) break;

        try {
            const feed = await parser.parseURL(feedUrl);
            await processFeedItems(feed.items, articles);
        } catch (error) {
            console.error(`Error ingesting from ${feedUrl}:`, error);
        }
    }

    console.log(
        `Total ingested ${articles.length} articles with clean content`
    );
    return articles;
}
