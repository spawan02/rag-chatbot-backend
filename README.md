# RAG Chatbot Backend

## Overview
This repository contains the backend for a Retrieval-Augmented Generation (RAG) chatbot for news websites, developed as part of a Full Stack Developer assignment. It provides a REST API that processes user queries, retrieves relevant news passages, generates answers using Google Gemini, and manages chat sessions with caching.

**Key Features:**
-   **RAG Pipeline**: Ingests news, embeds content (Jina), stores in a vector DB (Qdrant), and uses Gemini for answers.
-   **Session Management**: Unique session IDs with per-session chat history.
-   **Caching**: Redis for history and query optimization.
-   **API**: Express.js server with REST endpoints and Socket.io for streaming.

## Tech Stack
-   **Backend**: Node.js (Express, TypeScript)
-   **Embeddings**: Jina Embeddings (Free Tier)
-   **Vector DB**: Qdrant Cloud (Free Tier)
-   **LLM API**: Google Gemini (Free Trial)
-   **Caching**: Azure-managed Redis
-   **Tools**: express-rate-limit (security)

## Installation and Setup

1.  **Prerequisites**: Node.js (v18+), Git, Accounts for Qdrant Cloud, Azure Redis, Jina, and Gemini (with API keys).
2.  **Clone Repo**: `git clone your-repo-url && cd rag-chatbot-backend`
3.  **Install Deps**: `npm install`
4.  **Environment Variables**: Create `.env` with:
    ```
    PORT=8000
    JINA_API_KEY=your_jina_key
    GEMINI_API_KEY=your_gemini_key
    QDRANT_URL=your_qdrant_url
    QDRANT_API_KEY=your_qdrant_api_key
    REDISHOSTNAME=your_azure_redis_hostname
    REDISACCESSKEY=your_azure_redis_access_key
    ```
5.  **Data Ingestion**: Run `npx ts-node src/ingest.ts` (once) to populate Qdrant with news data.
6.  **Run Server**: `npx ts-node src/app.ts`

## API Endpoints

-   **`GET /`**: Server health check.
-   **`POST /start-session`**: Get a new `sessionId`.
-   **`GET /history?sessionId={id}`**: Retrieve chat history.
-   **`POST /reset-session`**: Clear history for a session.
-   **`POST /chat`**: Send a query. (Response streamed via Socket.io; connect to `ws://localhost:8000` and emit `join-session`.)

## Caching & Performance (Addressing Assignment Requirement)

This backend leverages Redis for efficient caching, explicitly configuring TTLs and outlining cache warming for performance:

1.  **TTL (Time-To-Live) Configuration**:
    *   **Session History**: Chat history for each `sessionId` is stored in Redis. A **1-hour TTL (3600 seconds)** is applied and refreshed on every user interaction (`POST /start-session`, `POST /chat`). This ensures inactive sessions expire automatically, managing memory effectively.
        *   *Configuration in Code*: `await redisClient.expire(sessionId, 3600);`
    *   **Prompt (Query Answer) Cache**: Full answers to specific queries are cached in Redis. A **5-minute TTL (300 seconds)** is set for these.
        *   *Configuration in Code*: `await redisClient.set(cacheKey, JSON.stringify(answer), { EX: 300 });`
        *   *Benefit*: Significantly reduces response times for repeated queries and lowers API costs by avoiding redundant RAG computations.

2.  **Cache Warming**:
    *   **Concept**: To improve initial load performance and responsiveness for common queries, cache warming involves pre-populating the cache.
    *   **How to Configure (Conceptual)**: On server startup (`src/app.ts` initialization), a background process would:
        1.  Define a list of `warmupQueries` (e.g., "latest world news", "top tech stories").
        2.  For each `warmupQuery`, perform the full RAG pipeline (embed, retrieve, generate answer via Gemini).
        3.  Store the generated `answer` in Redis under a specific key (e.g., `cache:query:${query}`) with a 5min TTL.
    *   *Benefit*: Ensures immediate cache hits for popular initial queries, enhancing user experience right from the start.

## Code Walkthrough & Design Highlights

-   **RAG Pipeline**: User queries are embedded (Jina), `top-k` (5) relevant news passages are retrieved (Qdrant), and these passages augment a prompt for Gemini, which then generates the answer.
-   **Backend Robustness**: Implemented `express-rate-limit` for API security.
-   **Cloud-Native**: Leverages Azure Redis and Qdrant Cloud for managed, scalable infrastructure.

---