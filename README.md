
<img width="1435" height="691" alt="Screenshot 2026-02-27 at 2 45 15 PM" src="https://github.com/user-attachments/assets/1f855520-cac5-4569-ae9e-f323495894ce" />


# GeoAgent

> **SEO made you findable. GEO makes you citable. This agent does it autonomously.**

**Turn real-time market data into AI-citable content — in 60 seconds.**

Google gets 8.5 billion searches a day, but increasingly people get answers from ChatGPT, Perplexity, and Google AI Overviews without clicking a link. If your content isn't structured for these AI engines to cite, you're invisible.

GeoAgent is an autonomous AI agent that researches live real estate data, builds a persistent knowledge graph, and generates content briefs scored for **GEO (Generative Engine Optimization)** — the discipline of making content citable by AI search engines.

Built for the [SF Autonomous Agents Hackathon](https://luma.com/sfagents) — Context Engineering Challenge (Feb 27, 2026).

---

## The Problem

Real estate brokerages spend 2–4 hours per market report manually researching prices, inventory, trends, and neighborhood data. The content they produce is:

- **Stale** — based on whatever the writer Googled that day
- **Unstructured** — no JSON-LD schemas, no FAQ markup, no source attribution
- **Invisible to AI** — ChatGPT and Perplexity cite fewer than 10% of top-ranking Google pages

Meanwhile, AI search engines decide what to cite based on **data density, structured markup, source authority, and content freshness** — none of which most content teams optimize for.

## The Solution

GeoAgent compresses that entire workflow into a single autonomous agent run:

1. **Type a location** — "Irvine, CA"
2. **Pick a content type** — Market Report, Investment Analysis, Neighborhood Guide, or Buyer Guide
3. **Watch the agent work** — it researches live data, stores findings in a knowledge graph, and generates a GEO-optimized brief

The output is a complete content brief with:
- **Data-backed claims** with source URLs and confidence levels
- **GEO citability score** (0–100) across 6 dimensions
- **JSON-LD schemas** (Article, FAQPage, BreadcrumbList) for AI discoverability
- **FAQ section** with researched, data-driven answers
- **Competitor gaps** — what existing content misses
- **LLM citability tips** — specific advice for maximizing AI citations

### The Self-Improvement Loop

This is the "context engineering" core:

- **Knowledge accumulates** — the Neo4j graph persists across runs. Research Oakland after San Francisco, and the agent already knows Bay Area market context.
- **Sources get ranked** — the agent tracks which domains yielded the most useful data and prioritizes them in future runs.
- **Scores drive refinement** — the system prompt dynamically includes the average GEO score and weakest dimension, so the agent focuses on improving where it's weakest.

Every run makes the next one smarter.

---

## How It Works

```
User Input (location + content type)
        │
        ▼
┌─────────────────────────────────────────┐
│           AGENT ORCHESTRATOR            │
│  Grok (reasoning) + Gemini (content)    │
│                                         │
│  Dynamic system prompt injects:         │
│  - Preferred sources from prior runs    │
│  - Average GEO score + weak dimensions  │
│  - Existing graph data for the region   │
└───────┬──────────┬──────────┬───────────┘
        │          │          │
   RESEARCH    CONNECT    GENERATE
        │          │          │
        ▼          ▼          ▼
   ┌────────┐ ┌────────┐ ┌──────────┐
   │ Tavily │ │ Neo4j  │ │ GEO      │
   │ Search │ │ Graph  │ │ Scoring  │
   │ Extract│ │ Upsert │ │ JSON-LD  │
   └────────┘ │ Query  │ │ Brief    │
              └────────┘ └──────────┘
                   │
                   ▼
        ┌──────────────────┐
        │  Knowledge Graph │  (persists across runs)
        │  Neo4j AuraDB    │
        └──────────────────┘
```

**7 autonomous tools** the agent calls on its own:

| Tool | Phase | What it does |
|------|-------|-------------|
| `search_market_data` | Research | Live market prices, inventory, trends via Tavily |
| `search_neighborhood_info` | Research | Schools, amenities, walkability, lifestyle |
| `extract_page_content` | Research | Deep-dive into a specific URL |
| `store_market_signal` | Connect | Write a data point to Neo4j with source attribution |
| `store_amenity` | Connect | Write a neighborhood amenity to Neo4j |
| `query_knowledge_graph` | Connect | Read existing data before researching |
| `generate_content_brief` | Generate | Produce the final GEO-scored brief via Gemini |

**GEO Scoring** (deterministic, no LLM):

| Dimension | Max Points | What it measures |
|-----------|-----------|-----------------|
| Data-Backed Claims | 20 | Cited facts with source URLs |
| Structured Data | 20 | JSON-LD schemas present |
| Content Structure | 20 | FAQ, headings, bullet points, meta description |
| Freshness | 15 | How recent the data is |
| Original Insights | 15 | Competitor gaps, cross-references, comparisons |
| Source Authority | 10 | .gov, major news, industry sources weighted higher |

---

## Tech Stack

| Technology | Role |
|-----------|------|
| **Next.js 15** (App Router) | Web framework + SSE streaming |
| **TypeScript** | Language |
| **Grok** (xAI) | Agent reasoning + tool calling |
| **Gemini** (Google) | Content generation + brief writing |
| **Tavily** | Real-time web search + content extraction |
| **Neo4j AuraDB** | Persistent knowledge graph |
| **react-force-graph-2d** | Real-time graph visualization |
| **Tailwind CSS** | Styling |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+

### Setup

```bash
pnpm install
cp .env.example .env.local
# Fill in your API keys (see docs/PROVIDER_SETUP.md)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```
GROK_API_KEY=xai-...
GOOGLE_GEMINI_API_KEY=...
TAVILY_API_KEY=tvly-...
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=...
```

---

## What is GEO?

**Generative Engine Optimization** is the practice of structuring content so AI-powered search platforms retrieve, cite, and recommend it. Unlike traditional SEO (ranking in 10 blue links), GEO is about earning a place among the 2–7 sources that LLMs cite in a single response.

Research shows that content with **cited statistics, structured data markup, and authoritative sourcing** gets cited 30–40% more often by AI engines than generic content — even if that generic content ranks higher on Google.

GeoAgent implements every known GEO technique:
- Data-backed claims with inline source attribution
- JSON-LD structured data (Article, FAQPage, BreadcrumbList)
- FAQ sections with researched, quantitative answers
- Content freshness signals tied to real-time data
- Source authority weighting
- `llms.txt` file for AI crawler guidance

---

## Documentation

- [Technical Architecture](docs/ARCHITECTURE.md) — System design, graph schema, agent tools, GEO scoring
- [Business Case](docs/BUSINESS_CASE.md) — Problem statement, market opportunity, competitive positioning
- [Provider Setup](docs/PROVIDER_SETUP.md) — API keys and setup for each provider
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) — Build timeline
- [Demo Script](docs/DEMO_SCRIPT.md) — 5-minute pitch for judges

---

## License

MIT
