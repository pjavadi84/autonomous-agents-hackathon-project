# Provider Setup Guide

## Essential Providers

### OpenAI
**Role**: Core reasoning engine (agent orchestration + content generation)
**Models Used**: GPT-4o (reasoning, brief generation), GPT-4o-mini (data extraction, classification)

**Setup:**
1. Get API key from hackathon sponsors or https://platform.openai.com
2. Add to `.env.local`: `OPENAI_API_KEY=sk-...`

**Pricing (if using own credits):**
- GPT-4o: ~$2.50/1M input tokens, $10/1M output tokens
- GPT-4o-mini: ~$0.15/1M input tokens, $0.60/1M output tokens
- Estimated cost per agent run: ~$0.05-0.15

**What to ask sponsors:** "Do you have hackathon API credits for GPT-4o access?"

---

### Tavily
**Role**: Real-time web search and content extraction for market data
**Endpoints Used**: `search()`, `extract()`

**Setup:**
1. Sign up at https://tavily.com (free tier: 1,000 credits/month, no credit card)
2. Get API key from dashboard
3. Add to `.env.local`: `TAVILY_API_KEY=tvly-...`

**SDK**: `pnpm add @tavily/core`

**Credit Usage Per Agent Run:**
- 3-4 `search()` calls at advanced depth: ~4 credits each = 12-16 credits
- 1-2 `extract()` calls: ~2 credits each = 2-4 credits
- Total: ~15-20 credits per run

**What to ask sponsors:** "Can I get additional Tavily credits beyond the free tier for hackathon testing?"

**Documentation:** https://docs.tavily.com

---

### Neo4j
**Role**: Knowledge graph storage (persistent across agent runs)

**PRIZE**: "Best Use of Neo4j" — 3 winners (per team member): 1st place credits, 2nd place Bose QuietComfort Ultra Earbuds (2nd Gen), 3rd place JBL Flip 7 Speaker.

**Hackathon Demo App**: https://context-graph-demo.vercel.app/ — A decision tracing system using Neo4j as a knowledge graph with semantic search and graph analytics. GitHub repo: github.com/johnymontana/context-graph-demo. Good reference for graph visualization and querying patterns.

**Setup (Hackathon-Specific):**
1. **Primary**: Go to https://sandbox.neo4j.com → select "Blank Sandbox" to create a blank instance
2. **Fallback**: If Sandbox has issues, Neo4j is providing free Enterprise Aura database instances for the hackathon (limited number — ask Nyah Macklin or Yolande Poirier at the Neo4j booth)
3. **Local option**: Download Neo4j Desktop for running Enterprise instances locally (recommended for large datasets)
4. Copy the connection URI, username, and password
5. Add to `.env.local`:
   ```
   NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=...
   ```

**Public Read-Only Instance (for testing):**
There's a pre-populated IKEA dataset with vector embeddings + graph data, useful for testing MCP-enabled agents:
```
NEO4J_URI=neo4j+s://9ee8bec3.databases.neo4j.io
NEO4J_USERNAME=read_only
NEO4J_PASSWORD=read_only
NEO4J_DATABASE=neo4j
```

**SDK**: `pnpm add neo4j-driver`

**MCP Server**: https://github.com/neo4j-contrib/mcp-neo4j — Neo4j MCP servers with setup videos for Cursor, Claude Code, and VSCode + Copilot. Consider using MCP for agent-to-graph communication instead of raw Cypher.

**Documentation:**
- JavaScript Driver: https://neo4j.com/docs/javascript-manual/current/
- Cypher Query Language: https://neo4j.com/docs/cypher-manual/current/
- GraphAcademy (TypeScript course): https://graphacademy.neo4j.com/courses/app-typescript/
- Agentic KG Construction (DeepLearning.ai course): referenced in hackathon resources
- Neo4j Blog on Context Graphs: https://neo4j.com/blog/genai/hands-on-with-context-graphs-and-neo4j/

**Neo4j Contacts**: Nyah Macklin, Yolande Poirier

---

### Render
**Role**: Production deployment

**Setup:**
1. Sign up at https://render.com
2. Connect GitHub repository
3. Create a new Web Service pointing to the repo
4. Set environment variables in Render dashboard
5. Alternatively, use `render.yaml` for Blueprint deployment

**Free Tier:**
- 750 instance-hours/month
- Spins down after 15 min inactivity (cold start ~1 min)
- Free PostgreSQL (1GB, 30-day limit) — not needed, we use Neo4j

**What to ask sponsors:** "Do you have Render credits to avoid cold-start delays during the demo?"

---

## Optional Providers

### Senso
**Role**: GEO/AEO validation — verify how AI engines currently cite real estate content
**Website**: https://senso.ai
**Free Tier**: "Free to start, no credit card required"

**Potential Use:**
- Validate your content brief against how ChatGPT/Perplexity currently answers real estate queries
- Measure citation share before vs. after publishing GEO-optimized content
- Add a "Senso Validation" step to the agent pipeline

**What to ask sponsors:** "Can I get API access to run GEO evaluations against AI engines for real estate queries?"

---

### Reka AI
**Role**: Fallback multimodal LLM with built-in web search
**Website**: https://docs.reka.ai

**Potential Use:**
- Research API: alternative to Tavily for web search (built into the model)
- Vision API: analyze property listing photos for quality assessment
- Fallback reasoning engine if OpenAI quota is exhausted

**What to ask sponsors:** "Do you have API credits for the Research and Vision APIs?"

---

## Environment Variables Template

Create `.env.local` in the project root:

```bash
# Essential
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=...

# Optional
SENSO_API_KEY=...
REKA_API_KEY=...
```

## Quick Verification

After setting up all providers, verify connectivity:

```bash
# Test OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" | head -c 200

# Test Tavily
curl -X POST https://api.tavily.com/search \
  -H "Content-Type: application/json" \
  -d '{"api_key":"'$TAVILY_API_KEY'","query":"test","max_results":1}'

# Neo4j: verify via console.neo4j.io or run in the app
```
