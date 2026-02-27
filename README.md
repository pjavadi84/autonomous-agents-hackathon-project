# GeoAgent

**Real-Time Market Intelligence Agent for Real Estate Content**

An autonomous, self-improving AI agent that researches live real estate market data, builds a persistent knowledge graph, and generates GEO-optimized (Generative Engine Optimization) content briefs — content structured so AI search engines (ChatGPT, Perplexity, Google AI Overviews) will cite it.

Built for the [SF Autonomous Agents Hackathon](https://luma.com/sfagents) (Feb 27, 2026).

## How It Works

```
User Input (location + topic)
        │
        ▼
┌─────────────────────────────────────────┐
│           AGENT ORCHESTRATOR            │
│  Grok (reasoning) + Gemini (content)    │
│                                         │
│  System prompt includes self-improvement│
│  context from prior runs (top sources,  │
│  avg GEO score, weak dimensions)        │
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

**3-Phase Agent Loop:**

1. **RESEARCH** — Tavily searches live market data, listings, news, neighborhood info
2. **CONNECT** — Neo4j builds/updates a knowledge graph linking locations, neighborhoods, market signals, sources, and amenities
3. **GENERATE** — Gemini produces a GEO-optimized content brief with data-backed claims, JSON-LD schemas, FAQ sections, and an LLM citability score

The agent self-improves by tracking source quality, accumulating knowledge across runs, and refining its approach based on GEO score feedback.

## Tech Stack

| Technology | Role |
|-----------|------|
| **Next.js 15** (App Router) | Web framework |
| **TypeScript** | Language |
| **Grok (xAI)** | Agent reasoning + tool calling |
| **Gemini (Google)** | Content generation + brief writing |
| **Tavily** | Real-time web search + content extraction |
| **Neo4j AuraDB** | Knowledge graph (persistent) |
| **react-force-graph-2d** | Graph visualization |
| **Tailwind CSS** | Styling |
| **Render** | Deployment |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Fill in your API keys (see docs/PROVIDER_SETUP.md)

# Start development server
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

## Documentation

- [Technical Architecture](docs/ARCHITECTURE.md) — System design, graph schema, agent tools, GEO scoring
- [Business Case](docs/BUSINESS_CASE.md) — Problem statement, market opportunity, competitive positioning
- [Provider Setup](docs/PROVIDER_SETUP.md) — API keys, free tiers, hackathon credits for each sponsor
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) — Hour-by-hour build timeline
- [Demo Script](docs/DEMO_SCRIPT.md) — 5-minute presentation for judges

## What is GEO?

**Generative Engine Optimization (GEO)** is the practice of structuring content so that AI-powered search platforms can retrieve, cite, and recommend it. Unlike traditional SEO (ranking in 10 blue links), GEO is about earning a place among the 2-7 domains that LLMs cite in a single response.

Key GEO techniques this agent implements:
- Data-backed claims with cited sources
- JSON-LD structured data (Article, FAQPage, BreadcrumbList)
- FAQ sections with real, researched answers
- Content freshness signals
- Source authority weighting
- `llms.txt` file for AI crawler guidance

## License

MIT
