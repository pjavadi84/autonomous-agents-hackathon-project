"use client";

import { useEffect, useRef } from "react";
import type { AgentEvent } from "@/lib/agent/types";

const PHASE_COLORS: Record<string, string> = {
  research: "text-blue-400",
  connect: "text-green-400",
  generate: "text-purple-400",
};

const TOOL_ICONS: Record<string, string> = {
  search_market_data: "🔍",
  search_neighborhood_info: "🏘️",
  extract_page_content: "📄",
  store_market_signal: "💾",
  store_amenity: "📍",
  query_knowledge_graph: "🔗",
  generate_content_brief: "✨",
};

export default function AgentConsole({ events }: { events: AgentEvent[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
        Agent reasoning will appear here...
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto space-y-2 font-mono text-xs">
      {events.map((event, i) => (
        <div key={i} className="leading-relaxed">
          {event.type === "phase" && (
            <div className={`font-bold uppercase tracking-wide ${PHASE_COLORS[event.phase] || "text-white"}`}>
              ▸ Phase: {event.phase}
            </div>
          )}
          {event.type === "tool_call" && (
            <div className="text-neutral-300">
              <span className="mr-1">{TOOL_ICONS[event.name] || "⚙️"}</span>
              <span className="text-yellow-400">{event.name}</span>
              <span className="text-neutral-500 ml-1">
                ({Object.entries(event.args).map(([k, v]) => `${k}: ${typeof v === "string" ? v.slice(0, 50) : JSON.stringify(v)}`).join(", ")})
              </span>
            </div>
          )}
          {event.type === "tool_result" && (
            <div className="text-neutral-400 pl-5">
              ↳ {event.summary}
            </div>
          )}
          {event.type === "thinking" && (
            <div className="text-neutral-500 italic">
              💭 {event.content.slice(0, 200)}
            </div>
          )}
          {event.type === "graph_update" && (
            <div className="text-green-400 pl-5">
              📊 Graph: +{event.nodesAdded} nodes
            </div>
          )}
          {event.type === "error" && (
            <div className="text-red-400">
              ❌ {event.message}
            </div>
          )}
          {event.type === "complete" && (
            <div className="text-emerald-400 font-bold mt-2">
              ✅ Brief generated! GEO Score: {event.brief.geoScore.overall}/100
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
