# Demo Script (5 Minutes)

## Setup Before Demo
- Have the app open in browser (deployed URL or localhost:3000)
- Neo4j console open in a background tab (console.neo4j.io) for optional graph verification
- Clear any prior agent runs if you want a clean demo

---

## 1. Introduction (30 seconds)

> "I'm Pouya. I built GeoAgent — an autonomous AI agent that produces content briefs optimized for AI search engines."
>
> "We all know SEO — ranking in Google's 10 blue links. But there's a new challenge: GEO — Generative Engine Optimization. When someone asks ChatGPT or Perplexity 'what's the housing market like in San Francisco?', which sources get cited? Fewer than 10% of sources cited by AI engines actually rank in the top 10 on Google. GEO is a completely different game."
>
> "GeoAgent solves this by researching real-time market data, building a knowledge graph, and generating content briefs that maximize AI citability."

---

## 2. Live Agent Run (60 seconds)

> "Let me show you. I'll generate a market report for San Francisco."

**Action**: Type "San Francisco, CA" in the location field, select "Market Report", hit Generate.

> "Watch the agent console on the left. The agent is deciding what to research — it's calling Tavily to search for current median home prices, inventory levels, days on market..."

**Point to the agent console** as search results stream in.

> "Now it found some promising data — it's storing each fact as a node in our knowledge graph. 'SF median home price is $1.4M, down 3% year-over-year' — that becomes a MarketSignal node, linked to the source URL."

> "It's now searching for neighborhood-level data — Mission District, SOMA, Marina... and storing amenities, school ratings, walkability scores."

---

## 3. Knowledge Graph (30 seconds)

**Point to the graph visualization in the center column.**

> "Every piece of data becomes a node in this graph. Red nodes are locations, blue are neighborhoods, orange are market signals, gray are sources. You can see the connections forming — neighborhoods linked to their market signals, each signal linked to its source URL."
>
> "This graph persists. It grows with every agent run. Next time someone generates a brief for San Francisco — or even Oakland — the agent already has this data."

---

## 4. Generated Brief (45 seconds)

**Point to the brief output on the right.**

> "Here's the output — a complete GEO-optimized content brief."

**Point to the GEO score badge.**

> "First, the GEO citability score: 78 out of 100. This is a deterministic algorithm scoring six dimensions."

**Scroll through the brief.**

> "Data-backed claims — each one has a specific number, a source URL, and a confidence level. 'Median home price in SF is $1.4M as of February 2026, down 3% year-over-year, source: Zillow Research.'"
>
> "FAQ section — real questions with data-driven answers, structured for FAQPage schema. AI engines love pulling from FAQ sections."
>
> "And here's the JSON-LD — Article schema, FAQPage schema, BreadcrumbList schema. This is the structured data that AI crawlers parse. Most real estate content doesn't have this."

---

## 5. Self-Improvement Demo (30 seconds)

> "Now here's the key part — the agent gets smarter."

**Action**: Type "Oakland, CA" and generate another brief.

> "Watch — the agent starts by querying the knowledge graph. It already has SF data it can cross-reference. And the system prompt now includes preferred sources from the first run — it learned that Zillow Research and Redfin were the most productive sources."
>
> "The second brief scores higher because the agent had richer context. This is the self-improvement loop — source quality tracking, knowledge accumulation, and score-based refinement."

---

## 6. Closing (30 seconds)

> "GeoAgent uses four sponsor tools: Tavily for real-time web search, Neo4j for the knowledge graph, OpenAI for reasoning and generation, and it's deployed on Render."
>
> "The key insight is that this is context engineering — the agent's context gets richer with every cycle. The knowledge graph is the memory. The GEO score is the feedback loop. And the content briefs are real-world action: data-backed, structured, and built to be cited by AI."

---

## Backup Plan

If the live demo fails:
1. Show pre-saved screenshots of a successful run
2. Show the Neo4j console with the populated graph
3. Show the brief JSON output directly
4. The graph visualization with pre-populated data is the most impressive visual — have it loaded in a separate tab

## Key Phrases to Hit

- **"Context engineering"** — matches the hackathon theme exactly
- **"Self-improving"** — the agent adapts based on prior runs
- **"Real-time knowledge"** — not cached LLM knowledge, but live Tavily data
- **"Meaningful action"** — produces a tangible, usable content brief
- **"The knowledge graph is the memory"** — the graph persists and grows
- **"GEO citability score"** — a novel, quantifiable metric

## Questions Judges Might Ask

**Q: How is this different from just asking ChatGPT to write an article?**
> "ChatGPT writes from its training data — which is months old. GeoAgent researches live data, cites specific sources, and structures the output with JSON-LD so other AI engines can parse and cite it. It's not generating content — it's generating a content brief with a research layer and GEO optimization."

**Q: How does the self-improvement actually work?**
> "Three mechanisms: 1) Source quality tracking — it remembers which domains gave the best data. 2) Knowledge graph accumulation — prior research persists and enriches future runs. 3) Score-based refinement — it sees its average GEO score and weakest dimension, then focuses on improving that."

**Q: What's the business model?**
> "SaaS for real estate content teams. A brokerage covering 10 markets needs 100+ articles, each refreshed quarterly. Manual research is 2-4 hours per article. GeoAgent does it in 2-3 minutes with fresher, more structured data."

**Q: Why Neo4j instead of a vector database?**
> "Real estate data is inherently a graph — neighborhoods connect to schools, market signals, amenities, and sources. GraphRAG lets the agent traverse these relationships to find cross-references, not just similar vectors. The graph also provides explainability — you can see exactly what data informed each claim."
