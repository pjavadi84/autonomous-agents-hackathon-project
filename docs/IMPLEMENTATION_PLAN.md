# Implementation Plan

## Timeline: 5.5 Hours (11:00 AM - 4:30 PM)

---

## Hour 0:00-0:30 — Project Scaffold (30 min)

### Tasks
1. Initialize Next.js 15 project with App Router, TypeScript, Tailwind, `src/` directory
   ```bash
   pnpm create next-app@latest . --typescript --tailwind --app --src-dir --use-pnpm
   ```
2. Install dependencies
   ```bash
   pnpm add openai @tavily/core neo4j-driver zod
   pnpm add -D @types/node
   pnpm add react-force-graph-2d
   ```
3. Create `.env.local` with all API keys (see PROVIDER_SETUP.md)
4. Create Neo4j AuraDB Free instance at console.neo4j.io
5. Create the directory structure under `src/lib/` and `src/components/`
6. Write client singletons:
   - `src/lib/openai/client.ts`
   - `src/lib/tavily/client.ts`
   - `src/lib/neo4j/client.ts`
7. Verify: `pnpm dev` runs, all three clients connect successfully

### Exit Criteria
- App running at localhost:3000
- Console logs confirm: "OpenAI connected", "Tavily ready", "Neo4j connected"

---

## Hour 0:30-1:30 — Core Agent Engine (60 min)

This is the most critical phase. The agent loop is the core of the project.

### Tasks
1. **`src/lib/agent/types.ts`** — Define TypeScript types:
   - `AgentEvent` union type (phase, tool_call, tool_result, thinking, graph_update, complete, error)
   - `ContentBrief` interface (full brief schema)
   - `DataClaim` interface
   - `GeoScore` interface
   - `AgentConfig` (location, topic, contentType, onEvent callback)

2. **`src/lib/agent/tools.ts`** — Define all 7 tool schemas:
   - Write the OpenAI function calling JSON schemas for each tool
   - Create a `toolImplementations` map that routes tool names to handler functions
   - Initially, implement handlers as stubs that return mock data
   - Wire up `search_market_data` and `store_market_signal` with real implementations first

3. **`src/lib/agent/prompts.ts`** — Write the system prompt:
   - 3-phase instructions (RESEARCH → CONNECT → GENERATE)
   - GEO optimization guidance
   - Self-improvement rules
   - `{dynamicContext}` placeholder for runtime injection

4. **`src/lib/agent/index.ts`** — The agentic loop:
   ```typescript
   async function runAgent(config: AgentConfig): Promise<ContentBrief> {
     const messages = [{ role: 'system', content: buildSystemPrompt() }];
     messages.push({ role: 'user', content: buildUserMessage(config) });

     for (let i = 0; i < MAX_ITERATIONS; i++) {
       const response = await openai.chat.completions.create({
         model: 'gpt-4o',
         messages,
         tools: toolDefinitions,
       });

       const choice = response.choices[0];
       if (choice.finish_reason === 'stop') break;

       if (choice.message.tool_calls) {
         for (const toolCall of choice.message.tool_calls) {
           config.onEvent({ type: 'tool_call', name: toolCall.function.name, args: JSON.parse(toolCall.function.arguments) });
           const result = await executeToolCall(toolCall);
           config.onEvent({ type: 'tool_result', name: toolCall.function.name, summary: summarize(result) });
           messages.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(result) });
         }
       }
     }
   }
   ```

### Exit Criteria
- Agent loop runs end-to-end with at least mock tool responses
- SSE events stream correctly (test with curl)
- Agent calls tools in a logical order (search → store → query → generate)

---

## Hour 1:30-2:15 — Tavily + Neo4j Integration (45 min)

### Tasks
1. **`src/lib/tavily/search.ts`**
   - `searchMarketData(query, location, timeRange?)` — Tavily search with real estate domain filter
   - `searchNeighborhoodInfo(neighborhood, aspects?)` — Tavily search for lifestyle/amenity info
   - Both return normalized results with title, url, content, score

2. **`src/lib/tavily/extract.ts`**
   - `extractPageContent(urls: string[])` — Tavily extract with markdown format
   - Returns parsed content per URL

3. **`src/lib/neo4j/schema.ts`**
   - Node label constants: `LOCATION`, `NEIGHBORHOOD`, `MARKET_SIGNAL`, `SOURCE`, `AMENITY`, `CONTENT_BRIEF`
   - Relationship type constants: `HAS_NEIGHBORHOOD`, `HAS_SIGNAL`, `SOURCED_FROM`, etc.

4. **`src/lib/neo4j/queries.ts`** — All Cypher queries:
   - `upsertLocation(name, type, state)`
   - `upsertNeighborhood(name, location, data)`
   - `createMarketSignal(neighborhood, signal, source)`
   - `createAmenity(neighborhood, location, amenity)`
   - `getFullContext(location)`
   - `getMarketSignals(location)`
   - `getTopSourceDomains()` — for self-improvement
   - `getAverageGeoScore()` — for self-improvement
   - `getGraphVisualizationData()` — for UI
   - `storeContentBrief(brief, location)`

5. Wire tool implementations in `tools.ts` to real Tavily/Neo4j calls

### Exit Criteria
- `search_market_data` returns real Tavily results
- `store_market_signal` creates nodes in Neo4j (verify in console.neo4j.io)
- `query_knowledge_graph` returns stored data
- Full agent run populates the graph with real data

---

## Hour 2:15-2:45 — GEO Scoring + Brief Generation (30 min)

### Tasks
1. **`src/lib/geo/scoring.ts`**
   - `computeGeoScore(brief)` — deterministic scoring across 6 dimensions
   - Helper functions: `scoreFreshness()`, `scoreSourceAuthority()`, `scoreContentStructure()`, `scoreOriginalInsights()`
   - Domain authority mapping (zillow.com → "industry", nar.realtor → "government", etc.)

2. **`src/lib/geo/jsonld.ts`**
   - `generateArticleSchema(brief)` — Article JSON-LD
   - `generateFaqSchema(brief)` — FAQPage JSON-LD
   - `generateBreadcrumbSchema(brief)` — BreadcrumbList JSON-LD
   - `generateLocalBusinessSchema(brief)` — LocalBusiness JSON-LD (for neighborhood guides)

3. **`src/lib/geo/brief.ts`**
   - `generateBrief(location, topic, contentType, graphContext)` — orchestrates:
     1. Call GPT-4o with graph context + GEO generation prompt
     2. Parse structured output into ContentBrief
     3. Run GEO scoring
     4. Attach JSON-LD templates
     5. Return complete brief

4. **`src/lib/store.ts`**
   - Simple `Map<string, ContentBrief>` with `addBrief()`, `getBrief()`, `listBriefs()`

### Exit Criteria
- `generate_content_brief` tool produces a complete ContentBrief with score
- GEO score is computed correctly (spot-check each dimension)
- JSON-LD schemas are valid

---

## Hour 2:45-3:00 — API Routes (15 min)

### Tasks
1. **`src/app/api/agent/route.ts`**
   - POST handler: parse body, create ReadableStream, run agent with onEvent callback, stream SSE events
   - Error handling: catch agent errors, send error event, close stream

2. **`src/app/api/graph/route.ts`**
   - GET handler: query Neo4j for visualization data, return nodes + edges JSON

3. **`src/app/api/briefs/route.ts`**
   - GET handler: return all briefs from store, or single brief by `?id=...`

### Exit Criteria
- `curl -X POST localhost:3000/api/agent -d '{"location":"San Francisco, CA","topic":"market report","contentType":"market_report"}'` streams events
- `curl localhost:3000/api/graph` returns graph JSON
- `curl localhost:3000/api/briefs` returns briefs array

---

## Hour 3:00-4:15 — Web UI (75 min)

### Phase 3a: Input Form (20 min)
- `src/components/input-form.tsx` — Location text input, content type dropdown, "Generate Brief" button
- `src/app/page.tsx` — Landing page with form, hero text, graph stats
- On submit: POST to /api/agent, redirect to /dashboard

### Phase 3b: Agent Console (25 min)
- `src/components/agent-console.tsx` — Scrolling log consuming SSE stream
  - Color-coded by phase (blue=RESEARCH, green=CONNECT, purple=GENERATE)
  - Shows tool name, parameters summary, and result summary
  - Auto-scrolls to bottom
- `src/components/step-indicator.tsx` — 3-step progress bar
- `src/app/dashboard/page.tsx` — 3-column layout wiring everything together

### Phase 3c: Graph Visualization (20 min)
- `src/components/graph-viz.tsx` — Force-directed graph using react-force-graph-2d
  - Nodes colored by type (Location=red, Neighborhood=blue, MarketSignal=orange, Source=gray, Amenity=green)
  - Node size proportional to connections
  - Hover tooltip showing node properties
  - Auto-refreshes after agent completes

### Phase 3d: Brief Display (10 min)
- `src/components/geo-score-badge.tsx` — Circular gauge showing 0-100 score
- `src/components/brief-card.tsx` — Preview card with title, score, date
- Wire brief display into dashboard right column
- `src/app/brief/[id]/page.tsx` + `src/components/brief-viewer.tsx` — Full detail view (if time permits)

### Exit Criteria
- Full flow works: enter location → see agent reasoning → see graph grow → see brief with score
- Graph visualization shows colored, labeled nodes
- Agent console streams in real-time

---

## Hour 4:15-4:45 — Self-Improvement + Polish (30 min)

### Tasks
1. Implement self-improvement context injection in `prompts.ts`:
   - Query top source domains → inject into system prompt
   - Query average GEO score + weakest dimension → inject into prompt
   - Query existing graph data for the location → skip redundant research

2. Add `llms.txt` file to project root

3. Polish:
   - Loading states (spinner during agent run)
   - Error handling (toast on failure, retry button)
   - Responsive layout (mobile-friendly)
   - Clean up console output formatting

4. End-to-end test: run the agent 2-3 times, verify self-improvement is visible

### Exit Criteria
- Second run for same/nearby location demonstrably uses prior data
- System prompt includes dynamic context on second run
- No crashes or unhandled errors

---

## Hour 4:45-5:15 — Deploy + Demo Prep (30 min)

### Tasks
1. Create `render.yaml` in project root
2. Push to GitHub
3. Connect Render to the repo, deploy
4. Set environment variables in Render dashboard
5. Run the agent once on the deployed version to populate the graph
6. Prepare demo: bookmark the deployed URL, have backup screenshots
7. Review demo script (see DEMO_SCRIPT.md)

### Exit Criteria
- App is live on Render
- Agent runs successfully in production
- Demo flow rehearsed once

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| OpenAI rate limits | Use GPT-4o-mini for extraction, GPT-4o only for reasoning/generation |
| Tavily credit exhaustion | Budget 15-20 credits per run, test with fewer searches first |
| Neo4j connection issues | AuraDB Free is reliable, but keep a fallback: store graph data in-memory if Neo4j is down |
| UI takes too long | Skip `/brief/[id]` detail page, show brief inline on dashboard |
| Agent loops too many times | Hard cap at 15 iterations, force `generate_content_brief` |
| Demo fails live | Have screenshots + pre-saved brief JSON as backup |
