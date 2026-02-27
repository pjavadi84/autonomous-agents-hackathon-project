# Demo Script & Pitch (5 Minutes)

## Setup Before Demo

- App open in browser at localhost:3000 (or deployed URL)
- Neo4j console open in background tab (console.neo4j.io) for optional graph verification
- Clear any prior agent runs if you want a clean demo, OR keep prior data to show the self-improvement loop

---

## 1. Opening Hook (30 seconds)

> "Google gets 8.5 billion searches a day. But increasingly, people aren't clicking links — they're getting answers from ChatGPT, Perplexity, and Google AI Overviews. If your content doesn't get cited by these AI engines, you're invisible. We built an agent that fixes that."

## 2. The Problem (30 seconds)

> "Real estate brokerages spend thousands on content — market reports, neighborhood guides, buyer guides. But 90% of it is generic, unstructured, and invisible to AI search engines. There's a new discipline called GEO — Generative Engine Optimization — which is like SEO but for AI. Nobody's doing it well because it requires real-time data, structured markup, and a very specific content format. That's a lot of manual work."

## 3. Live Demo (2 minutes)

> "GeoAgent is an autonomous agent that does the entire pipeline. Watch."

**Action**: Type "Irvine, CA", select "Investment Analysis", hit Generate.

### Left Panel — Agent Reasoning

> "The agent is reasoning in real-time. It first queries our knowledge graph for any existing data. Then it searches live market data through Tavily — prices, inventory, trends. It's finding that Orange County had a 9% price increase and a $42M mansion sale."

### Center Panel — Knowledge Graph

> "Every piece of data gets stored in a Neo4j knowledge graph. You can see nodes appearing — locations, neighborhoods, market signals, sources, amenities — all connected. This graph *persists*. The more you use GeoAgent, the smarter it gets."

### Right Panel — Generated Brief

> "And here's the output — a complete content brief scored 72 out of 100 on our GEO citability scale. It has a structured outline, data-backed claims with source attribution, an FAQ section, and JSON-LD schemas — Article, FAQPage, BreadcrumbList — everything AI search engines look for when deciding what to cite."

## 4. Self-Improvement Story (30 seconds)

> "Here's the key insight — run it again for a different city, and the agent starts by checking what it already knows. It gets faster and more accurate over time. The system prompt dynamically includes which sources were most productive, what the average GEO score has been, and which dimensions are weakest. This is context engineering — the agent's context gets richer with every cycle."

## 5. The Tech (30 seconds)

> "Under the hood: Grok handles reasoning and tool calling. Gemini generates the content. Tavily provides real-time web search. Neo4j stores the knowledge graph. Seven tools the agent calls autonomously — search, extract, store, query, generate. Deterministic GEO scoring across six dimensions. All streaming in real-time via SSE."

## 6. Close (30 seconds)

> "Every real estate brokerage needs content. None of them are optimized for AI search. GeoAgent turns a day of manual research into 60 seconds of autonomous intelligence — and the output is specifically engineered to be cited by the next generation of search."

---

## Demo Order (Recommended)

For maximum impact, run these in sequence:

1. **San Francisco, CA** — Market Report (largest dataset, impressive graph)
2. **Irvine, CA** — Investment Analysis (shows different content type)
3. **Oakland, CA** — Neighborhood Guide (agent finds SF data in graph — self-improvement visible)

The third run is the money shot: the agent discovers existing data in the knowledge graph, uses preferred sources from prior runs, and the brief scores higher.

---

## Backup Plan

If the live demo fails:
1. Show pre-saved screenshots of a successful run
2. Show the Neo4j console with the populated graph
3. Show the brief JSON output directly
4. The graph visualization with pre-populated data is the most impressive visual — have it loaded in a separate tab

---

## Key Phrases to Hit

- **"Context engineering"** — matches the hackathon theme exactly
- **"Self-improving"** — the agent adapts based on prior runs
- **"Real-time knowledge"** — not cached LLM knowledge, but live Tavily data
- **"Meaningful action"** — produces a tangible, usable content brief
- **"The knowledge graph is the memory"** — the graph persists and grows
- **"GEO citability score"** — a novel, quantifiable metric

---

## Questions Judges Might Ask

**Q: How is this different from just asking ChatGPT to write an article?**
> "ChatGPT writes from its training data — which is months old. GeoAgent researches live data, cites specific sources, and structures the output with JSON-LD so other AI engines can parse and cite it. It's not generating content — it's generating a content brief with a research layer and GEO optimization."

**Q: How does the self-improvement actually work?**
> "Three mechanisms: 1) Source quality tracking — it remembers which domains gave the best data. 2) Knowledge graph accumulation — prior research persists and enriches future runs. 3) Score-based refinement — it sees its average GEO score and weakest dimension, then focuses on improving that."

**Q: What's the business model?**
> "SaaS for real estate content teams. A brokerage covering 10 markets needs 100+ articles, each refreshed quarterly. Manual research is 2-4 hours per article. GeoAgent does it in 2-3 minutes with fresher, more structured data."

**Q: Why Neo4j instead of a vector database?**
> "Real estate data is inherently a graph — neighborhoods connect to schools, market signals, amenities, and sources. GraphRAG lets the agent traverse these relationships to find cross-references, not just similar vectors. The graph also provides explainability — you can see exactly what data informed each claim."

**Q: Why Grok + Gemini instead of a single LLM?**
> "Different strengths. Grok is fast at reasoning and tool calling — it decides what to research and when. Gemini excels at creative content generation — it writes the actual brief. Using both gives us speed on the orchestration side and quality on the output side."
