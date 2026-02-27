import grok, { GROK_MODEL } from "../llm/grok";
import { toolDefinitions, executeTool } from "./tools";
import { buildSystemPrompt, buildUserMessage } from "./prompts";
import { getTopSourceDomains, getAverageGeoScore } from "../neo4j/queries";
import { getWeakestDimension } from "../geo/scoring";
import type { AgentConfig, AgentEvent, ContentBrief, GeoScore } from "./types";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const MAX_ITERATIONS = 15;

async function buildDynamicContext(): Promise<string> {
  const parts: string[] = [];

  try {
    const topSources = await getTopSourceDomains();
    if (topSources.length > 0) {
      parts.push(
        `**Preferred Sources** (most productive in prior research): ${topSources.map((s) => s.domain).join(", ")}. Prioritize searching these first.`
      );
    }
  } catch {
    // No prior data yet
  }

  try {
    const scoreData = await getAverageGeoScore();
    if (scoreData?.avgScore && scoreData.briefCount > 0) {
      parts.push(
        `**Performance Feedback**: Your average GEO score across ${scoreData.briefCount} prior briefs is ${scoreData.avgScore}/100. Focus on improving weaker dimensions.`
      );
    }
  } catch {
    // No prior briefs yet
  }

  return parts.join("\n\n");
}

function summarizeResult(name: string, result: unknown): string {
  if (!result) return "No result";
  const r = result as Record<string, unknown>;

  switch (name) {
    case "search_market_data":
    case "search_neighborhood_info": {
      const results = (r.results as Array<Record<string, unknown>>) || [];
      const answer = r.answer as string;
      if (answer) return `Found ${results.length} results. Summary: ${answer.slice(0, 200)}...`;
      return `Found ${results.length} results`;
    }
    case "extract_page_content": {
      if (Array.isArray(result)) return `Extracted content from ${result.length} pages`;
      return "Extracted content";
    }
    case "store_market_signal":
      return `Stored: ${(r as Record<string, unknown>).headline || "market signal"}`;
    case "store_amenity":
      return `Stored amenity: ${(r as Record<string, unknown>).name || "amenity"}`;
    case "query_knowledge_graph": {
      if (Array.isArray(result)) return `Found ${result.length} records in knowledge graph`;
      return "Queried knowledge graph";
    }
    case "generate_content_brief": {
      const brief = result as unknown as ContentBrief;
      return `Generated brief: "${brief.title}" (GEO Score: ${brief.geoScore?.overall || "N/A"}/100)`;
    }
    default:
      return "Completed";
  }
}

function detectPhase(toolName: string): AgentEvent["type"] extends "phase" ? AgentEvent : never {
  const phaseMap: Record<string, "research" | "connect" | "generate"> = {
    search_market_data: "research",
    search_neighborhood_info: "research",
    extract_page_content: "research",
    store_market_signal: "connect",
    store_amenity: "connect",
    query_knowledge_graph: "connect",
    generate_content_brief: "generate",
  };
  return { type: "phase", phase: phaseMap[toolName] || "research" } as never;
}

export async function runAgent(config: AgentConfig): Promise<ContentBrief> {
  const { location, topic, contentType, onEvent } = config;

  // Build dynamic context from prior runs
  const dynamicContext = await buildDynamicContext();
  const systemPrompt = buildSystemPrompt(dynamicContext);
  const userMessage = buildUserMessage(location, topic, contentType);

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  let finalBrief: ContentBrief | null = null;
  let totalNodesAdded = 0;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    try {
      const response = await grok.chat.completions.create({
        model: GROK_MODEL,
        messages,
        tools: toolDefinitions,
        tool_choice: i >= MAX_ITERATIONS - 2 ? { type: "function", function: { name: "generate_content_brief" } } : "auto",
      });

      const choice = response.choices[0];
      const message = choice.message;

      // Add assistant message to history
      messages.push(message);

      // If agent is done thinking (no tool calls)
      if (choice.finish_reason === "stop" || !message.tool_calls?.length) {
        if (message.content) {
          onEvent({ type: "thinking", content: message.content });
        }
        if (finalBrief) break;
        // Force brief generation if agent stopped without generating
        continue;
      }

      // Process tool calls
      for (const toolCall of message.tool_calls) {
        if (toolCall.type !== "function") continue;
        const toolName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        // Emit phase change
        onEvent(detectPhase(toolName));

        // Emit tool call event
        onEvent({ type: "tool_call", name: toolName, args });

        try {
          const { result, nodesAdded } = await executeTool(toolName, args);

          // Track graph growth
          if (nodesAdded) {
            totalNodesAdded += nodesAdded;
            onEvent({ type: "graph_update", nodesAdded, edgesAdded: nodesAdded });
          }

          // Emit result summary
          const summary = summarizeResult(toolName, result);
          onEvent({ type: "tool_result", name: toolName, summary });

          // Check if this was the brief generation
          if (toolName === "generate_content_brief" && result) {
            finalBrief = result as ContentBrief;
          }

          // Add tool result to messages
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result).slice(0, 15000), // Truncate large results
          });
        } catch (toolError) {
          const errorMsg = toolError instanceof Error ? toolError.message : "Tool execution failed";
          onEvent({ type: "error", message: `${toolName}: ${errorMsg}` });
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: errorMsg }),
          });
        }
      }

      // If we got a brief, we're done
      if (finalBrief) break;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Agent iteration failed";
      onEvent({ type: "error", message: errorMsg });
      // Don't break on single iteration failures — retry
      if (i >= MAX_ITERATIONS - 1) break;
    }
  }

  if (!finalBrief) {
    throw new Error("Agent failed to generate a content brief after maximum iterations");
  }

  onEvent({ type: "complete", brief: finalBrief });
  return finalBrief;
}
