# Technical Architecture

## System Overview

GeoAgent is a Next.js 15 application that implements an autonomous AI agent using OpenAI's function calling API. The agent researches real-time real estate market data via Tavily, stores findings in a Neo4j knowledge graph, and generates GEO-optimized content briefs.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        WEB UI (Next.js)                     │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  Input    │  │ Agent Console│  │  Graph              │   │
│  │  Form     │  │ (SSE stream) │  │  Visualization      │   │
│  └────┬─────┘  └──────▲───────┘  └────────▲────────────┘   │
│       │               │                    │                │
│       │          SSE events           GET /api/graph        │
│       │               │                    │                │
│  POST /api/agent      │              GET /api/briefs        │
└───────┼───────────────┼────────────────────┼────────────────┘
        │               │                    │
        ▼               │                    │
┌───────────────────────┴────────────────────┴────────────────┐
│                     API LAYER (Route Handlers)               │
│                                                              │
│  POST /api/agent  →  Creates ReadableStream, runs agent,     │
│                      emits SSE events for each tool call     │
│                                                              │
│  GET /api/graph   →  Queries Neo4j for all nodes/edges       │
│                                                              │
│  GET /api/briefs  →  Returns briefs from in-memory store     │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    AGENT ORCHESTRATOR                         │
│                    (lib/agent/index.ts)                       │
│                                                              │
│  1. Build system prompt (inject self-improvement context)    │
│  2. Loop: call OpenAI with messages + tools                  │
│  3. Handle tool_calls → execute tool → append result         │
│  4. Emit SSE event for each step                             │
│  5. Max 15 iterations, then force brief generation           │
│  6. Return completed ContentBrief                            │
└──────┬──────────┬──────────┬──────────┬──────────────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
   │ Tavily │ │ Neo4j  │ │ OpenAI │ │  GEO   │
   │ Client │ │ Client │ │ Client │ │ Scorer │
   └────────┘ └────────┘ └────────┘ └────────┘
```

## Directory Structure

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page with input form
│   ├── globals.css
│   ├── dashboard/
│   │   └── page.tsx            # 3-column view: console | graph | brief
│   ├── brief/[id]/
│   │   └── page.tsx            # Full brief detail view
│   └── api/
│       ├── agent/route.ts      # POST: SSE streaming agent run
│       ├── graph/route.ts      # GET: graph data for visualization
│       └── briefs/route.ts     # GET: list/retrieve briefs
│
├── lib/                        # Server-side logic
│   ├── agent/
│   │   ├── index.ts            # CORE: Agentic loop orchestrator
│   │   ├── tools.ts            # 7 tool definitions + implementations
│   │   ├── prompts.ts          # System prompt with dynamic context injection
│   │   └── types.ts            # TypeScript types for events, tools, briefs
│   ├── tavily/
│   │   ├── client.ts           # Tavily client singleton (@tavily/core)
│   │   ├── search.ts           # Market data + neighborhood search wrappers
│   │   └── extract.ts          # URL content extraction wrapper
│   ├── neo4j/
│   │   ├── client.ts           # Neo4j driver singleton (neo4j-driver)
│   │   ├── queries.ts          # CORE: All Cypher queries
│   │   └── schema.ts           # Node label + relationship type constants
│   ├── geo/
│   │   ├── scoring.ts          # CORE: Deterministic GEO citability scoring
│   │   ├── jsonld.ts           # JSON-LD template generators
│   │   └── brief.ts            # Brief assembly + formatting
│   ├── openai/
│   │   └── client.ts           # OpenAI client singleton
│   └── store.ts                # In-memory Map<string, ContentBrief>
│
└── components/                 # Client-side React
    ├── input-form.tsx          # Location + topic + content type selector
    ├── agent-console.tsx       # Scrolling log of agent reasoning (SSE)
    ├── graph-viz.tsx           # Force-directed graph (react-force-graph-2d)
    ├── brief-card.tsx          # Brief preview card
    ├── brief-viewer.tsx        # Full brief display with JSON-LD
    ├── geo-score-badge.tsx     # Circular score gauge (0-100)
    └── step-indicator.tsx      # RESEARCH > CONNECT > GENERATE phases
```

---

## Neo4j Knowledge Graph Schema

### Node Types

#### Location
The top-level geographic entity (city, county, or state).

```
(:Location {
  id: string,           // UUID
  name: string,         // "San Francisco, CA"
  type: string,         // "city" | "county" | "state"
  state: string,        // "CA"
  lat: float?,          // Optional latitude
  lng: float?,          // Optional longitude
  createdAt: datetime
})
```

#### Neighborhood
A subdivision within a Location, enriched with market data over time.

```
(:Neighborhood {
  id: string,
  name: string,             // "Mission District"
  medianPrice: integer?,    // 1250000
  avgDaysOnMarket: integer?,// 28
  priceChangeYoY: float?,   // -0.03 (i.e., -3%)
  walkScore: integer?,      // 92
  description: string?,
  updatedAt: datetime
})
```

#### MarketSignal
A time-stamped market intelligence data point discovered during research.

```
(:MarketSignal {
  id: string,
  type: string,          // "price_trend" | "inventory" | "demand" | "regulation" | "development"
  headline: string,      // "SF Median Home Price Drops 3% YoY"
  summary: string,       // 2-3 sentences with specific numbers
  value: string?,        // "$1.2M median" or "28 days DOM"
  sentiment: string,     // "positive" | "negative" | "neutral"
  date: date,
  createdAt: datetime
})
```

#### Source
A web source that was researched and cited.

```
(:Source {
  id: string,
  url: string,
  title: string,
  domain: string,        // "zillow.com"
  publishedDate: date?,
  credibilityScore: float?,  // 0-1 scale
  createdAt: datetime
})
```

#### Amenity
A point of interest tied to a neighborhood.

```
(:Amenity {
  id: string,
  name: string,          // "Dolores Park"
  type: string,          // "school" | "park" | "transit" | "shopping" | "hospital" | "restaurant"
  rating: float?         // 1-10 scale
})
```

#### ContentBrief
A generated content brief stored as a graph node for relationship tracking.

```
(:ContentBrief {
  id: string,
  title: string,
  topic: string,
  geoScore: integer,     // 0-100
  createdAt: datetime,
  status: string         // "draft" | "final"
})
```

### Relationships

```cypher
-- Geographic hierarchy
(Location)-[:HAS_NEIGHBORHOOD]->(Neighborhood)
(Neighborhood)-[:BORDERS]->(Neighborhood)

-- Market intelligence
(Neighborhood)-[:HAS_SIGNAL]->(MarketSignal)
(MarketSignal)-[:AFFECTS]->(Location)           // { impact: float }
(MarketSignal)-[:SOURCED_FROM]->(Source)         // { extractedAt: datetime }

-- Amenities
(Neighborhood)-[:HAS_AMENITY]->(Amenity)        // { distance: string? }

-- Content briefs
(ContentBrief)-[:GENERATED_FOR]->(Location)
(ContentBrief)-[:COVERS]->(Neighborhood)
(ContentBrief)-[:CITES]->(Source)                // { claimText: string }
(ContentBrief)-[:INFORMED_BY]->(MarketSignal)
```

### Key Cypher Patterns

**Upsert neighborhood with market data:**
```cypher
MERGE (l:Location {name: $locationName})
ON CREATE SET l.id = randomUUID(), l.createdAt = datetime()
MERGE (n:Neighborhood {name: $neighborhoodName})
ON CREATE SET n.id = randomUUID()
MERGE (n)-[:HAS_NEIGHBORHOOD]->(l)
SET n.medianPrice = $medianPrice,
    n.avgDaysOnMarket = $dom,
    n.updatedAt = datetime()
```

**Store a market signal with source:**
```cypher
MERGE (n:Neighborhood {name: $neighborhood})
MERGE (s:Source {url: $sourceUrl})
ON CREATE SET s.id = randomUUID(), s.title = $sourceTitle,
              s.domain = $domain, s.createdAt = datetime()
CREATE (ms:MarketSignal {
  id: randomUUID(),
  type: $signalType,
  headline: $headline,
  summary: $summary,
  value: $value,
  sentiment: $sentiment,
  date: date(),
  createdAt: datetime()
})
CREATE (n)-[:HAS_SIGNAL]->(ms)
CREATE (ms)-[:SOURCED_FROM]->(s)
```

**Query full context for content generation:**
```cypher
MATCH (l:Location {name: $location})<-[:HAS_NEIGHBORHOOD]-(n:Neighborhood)
OPTIONAL MATCH (n)-[:HAS_SIGNAL]->(ms:MarketSignal)
OPTIONAL MATCH (ms)-[:SOURCED_FROM]->(s:Source)
OPTIONAL MATCH (n)-[:HAS_AMENITY]->(a:Amenity)
RETURN n, collect(DISTINCT ms) AS signals,
       collect(DISTINCT s) AS sources,
       collect(DISTINCT a) AS amenities
ORDER BY n.medianPrice DESC
```

**Self-improvement: top source domains:**
```cypher
MATCH (s:Source)<-[:SOURCED_FROM]-(ms:MarketSignal)
RETURN s.domain, count(ms) AS signalCount
ORDER BY signalCount DESC LIMIT 10
```

**Graph visualization data:**
```cypher
MATCH (n)-[r]->(m)
RETURN
  collect(DISTINCT {id: id(n), label: labels(n)[0], name: n.name}) +
  collect(DISTINCT {id: id(m), label: labels(m)[0], name: m.name}) AS nodes,
  collect({source: id(n), target: id(m), type: type(r)}) AS edges
```

---

## Agent Tools

The agent uses 7 tools via OpenAI function calling. The LLM autonomously decides which tools to call and in what order.

### Tool 1: `search_market_data`
**Phase**: RESEARCH
**Purpose**: Search for current real estate market data, listings, and trends
**Implementation**: Tavily `search()` with `topic: "news"`, `searchDepth: "advanced"`, filtered to real estate domains (zillow.com, realtor.com, redfin.com, nar.realtor, housingwire.com)
**Returns**: Array of search results with titles, URLs, content snippets, and Tavily's synthesized answer

### Tool 2: `search_neighborhood_info`
**Phase**: RESEARCH
**Purpose**: Search for neighborhood details — schools, amenities, walkability, lifestyle
**Implementation**: Tavily `search()` with `topic: "general"`, query constructed from neighborhood name + requested aspects
**Returns**: Array of search results focused on neighborhood quality of life

### Tool 3: `extract_page_content`
**Phase**: RESEARCH
**Purpose**: Deep-dive into a specific URL found during search
**Implementation**: Tavily `extract()` with `format: "markdown"`, `extractDepth: "advanced"`
**Returns**: Full page content as markdown

### Tool 4: `store_market_signal`
**Phase**: CONNECT
**Purpose**: Write a discovered market data point to the knowledge graph
**Parameters**: location, neighborhood, signalType, headline, summary, value, sentiment, sourceUrl, sourceTitle
**Implementation**: Cypher MERGE for Neighborhood + Source, CREATE for MarketSignal with relationships

### Tool 5: `store_amenity`
**Phase**: CONNECT
**Purpose**: Write a neighborhood amenity to the knowledge graph
**Parameters**: neighborhood, location, amenityName, amenityType, rating
**Implementation**: Cypher MERGE for Amenity + HAS_AMENITY relationship

### Tool 6: `query_knowledge_graph`
**Phase**: CONNECT
**Purpose**: Retrieve previously stored data for a location
**Parameters**: location, queryType (full_context | market_signals | neighborhoods | sources | amenities)
**Implementation**: One of several read-only Cypher queries depending on queryType

### Tool 7: `generate_content_brief`
**Phase**: GENERATE
**Purpose**: Generate the final GEO-optimized content brief
**Parameters**: location, topic, targetKeywords, contentType
**Implementation**:
1. Query full knowledge graph context for the location
2. Call GPT-4o with detailed GEO brief generation prompt
3. Run deterministic GEO scoring algorithm
4. Generate JSON-LD templates (Article, FAQPage, BreadcrumbList)
5. Store ContentBrief node in Neo4j with relationships
6. Return complete brief

---

## GEO Scoring Algorithm

Deterministic scoring (no LLM), computed in `lib/geo/scoring.ts`. Total: 100 points.

| Dimension | Max Points | Scoring Logic |
|-----------|-----------|---------------|
| **Data-Backed Claims** | 20 | 2 points per unique cited claim (max 10 claims = 20 pts) |
| **Structured Data** | 20 | 5 points per JSON-LD schema present: Article (5), FAQ (5), Breadcrumb (5), LocalBusiness (5) |
| **Content Structure** | 20 | FAQ section with 3+ questions (4), 3+ H2 sections (4), H3 sub-sections (4), bullet points per section (4), meta description 155-160 chars (4) |
| **Freshness** | 15 | Data < 1 week old (15), < 1 month (10), < 3 months (5), older (0) |
| **Original Insights** | 15 | Has competitor gap analysis (5), cross-referenced data from multiple sources (5), neighborhood comparison data (5) |
| **Source Authority** | 10 | Weighted average: .gov domains = 3, major news = 2, industry sites = 2, other = 1. Scaled to 0-10. |

Score ranges: 80-100 Excellent, 60-79 Good, 40-59 Needs Improvement, 0-39 Poor.

---

## Content Brief Output Schema

```typescript
interface ContentBrief {
  id: string;
  metadata: {
    location: string;
    topic: string;
    contentType: "neighborhood_guide" | "market_report" | "buyer_guide" | "investment_analysis";
    generatedAt: string;
    dataFreshness: string;
    sourcesCount: number;
    signalsCount: number;
  };
  geoScore: {
    overall: number;
    breakdown: {
      dataBackedClaims: number;
      structuredData: number;
      contentStructure: number;
      freshness: number;
      originalInsights: number;
      sourceAuthority: number;
    };
  };
  title: string;
  metaDescription: string;
  targetKeywords: string[];
  outline: Array<{
    h2: string;
    h3s?: string[];
    keyPoints: string[];
    dataClaims: DataClaim[];
  }>;
  dataClaims: DataClaim[];
  faqSection: Array<{
    question: string;
    answer: string;
    sourceUrl?: string;
  }>;
  jsonLd: {
    article: object;
    faqPage: object;
    breadcrumbList: object;
    localBusiness?: object;
  };
  sources: Array<{
    url: string;
    title: string;
    domain: string;
    usedForClaims: string[];
    credibilityNote: string;
  }>;
  competitorGaps: string[];
  llmCitabilityTips: string[];
}

interface DataClaim {
  claim: string;
  value: string;
  sourceUrl: string;
  sourceTitle: string;
  confidence: "high" | "medium";
}
```

---

## Self-Improvement Mechanisms

### 1. Source Quality Tracking
After each agent run, query Neo4j for which source domains yielded the most market signals. Inject the top domains into the system prompt for future runs:

```typescript
const topSources = await getTopSourceDomains(neo4jDriver);
// System prompt: "These source domains have been most productive: zillow.com, redfin.com..."
```

### 2. Knowledge Graph Accumulation
Every run adds data to Neo4j. On subsequent runs, the agent queries existing data first and skips re-researching topics where data is < 7 days old. The graph grows richer over time.

### 3. Score-Based Refinement
Track the GEO score of each generated brief. Inject the average score and weakest dimension into the system prompt:

```typescript
const avgScore = await getAverageGeoScore(neo4jDriver);
const weakest = getWeakestDimension(avgScore);
// System prompt: "Your average GEO score is 72/100. Weakest area: freshness. Focus on finding very recent data."
```

---

## Streaming Architecture

The `POST /api/agent` route uses Web Streams API for Server-Sent Events:

```typescript
// API Route
const stream = new ReadableStream({
  async start(controller) {
    const onEvent = (event: AgentEvent) => {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    };
    await runAgent({ location, topic, contentType, onEvent });
    controller.close();
  }
});
return new Response(stream, {
  headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
});
```

Client-side uses `fetch()` + `getReader()` to consume the stream and update React state.

### Event Types

```typescript
type AgentEvent =
  | { type: 'phase'; phase: 'research' | 'connect' | 'generate' }
  | { type: 'tool_call'; name: string; args: Record<string, unknown> }
  | { type: 'tool_result'; name: string; summary: string }
  | { type: 'thinking'; content: string }
  | { type: 'graph_update'; nodesAdded: number; edgesAdded: number }
  | { type: 'complete'; brief: ContentBrief }
  | { type: 'error'; message: string };
```

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Agent framework | OpenAI function calling directly | Simpler than Agents SDK (requires Node 22+). Full control over the loop and SSE streaming. |
| Graph visualization | `react-force-graph-2d` | Lightweight (~200KB), works with plain JSON, produces impressive visuals immediately. |
| Brief storage | In-memory `Map<string, ContentBrief>` | Neo4j stores graph structure; full brief JSON doesn't need graph queries. Resets on redeploy = fine for hackathon. |
| Streaming | SSE via ReadableStream | Native to Next.js Route Handlers. One-directional (server→client). No WebSocket setup needed. |
| Tavily endpoints | `search()` + `extract()` only | The `research()` method requires MongoDB. Standard endpoints + Neo4j as knowledge store is a cleaner architecture. |
