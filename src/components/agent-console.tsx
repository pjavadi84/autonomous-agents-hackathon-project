"use client";

import { useEffect, useRef } from "react";
import type { AgentEvent } from "@/lib/agent/types";

const PHASE_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  research: { color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20", label: "Research" },
  connect: { color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", label: "Connect" },
  generate: { color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20", label: "Generate" },
};

const TOOL_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  search_market_data: { icon: "S", label: "Search Market Data", color: "bg-blue-500" },
  search_neighborhood_info: { icon: "N", label: "Search Neighborhood", color: "bg-blue-500" },
  extract_page_content: { icon: "E", label: "Extract Content", color: "bg-blue-500" },
  store_market_signal: { icon: "W", label: "Store Signal", color: "bg-emerald-500" },
  store_amenity: { icon: "A", label: "Store Amenity", color: "bg-emerald-500" },
  query_knowledge_graph: { icon: "Q", label: "Query Graph", color: "bg-emerald-500" },
  generate_content_brief: { icon: "G", label: "Generate Brief", color: "bg-purple-500" },
};

function ToolIcon({ name }: { name: string }) {
  const tool = TOOL_LABELS[name] || { icon: "?", label: name, color: "bg-neutral-500" };
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold text-white ${tool.color} shrink-0`}
    >
      {tool.icon}
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-2 px-3 animate-fade-in">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span className="text-neutral-600 text-[10px]">thinking...</span>
    </div>
  );
}

function formatArgs(args: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(args)) {
    if (typeof v === "string") {
      parts.push(`${k}: "${v.length > 40 ? v.slice(0, 40) + "..." : v}"`);
    } else if (Array.isArray(v)) {
      parts.push(`${k}: [${v.length} items]`);
    }
  }
  return parts.join(", ");
}

export default function AgentConsole({ events, isRunning }: { events: AgentEvent[]; isRunning?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-sm gap-2">
        <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
          <span className="text-neutral-600 text-lg">&gt;_</span>
        </div>
        <span>Agent reasoning will appear here...</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto space-y-1 font-mono text-xs pr-1">
      {events.map((event, i) => (
        <div key={i} className="animate-fade-in">
          {event.type === "phase" && (
            <div className={`flex items-center gap-2 py-1.5 px-2 my-1 rounded-md border ${PHASE_STYLES[event.phase]?.bg || "bg-neutral-800 border-neutral-700"}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${PHASE_STYLES[event.phase]?.color || "text-white"}`}>
                {PHASE_STYLES[event.phase]?.label || event.phase}
              </span>
            </div>
          )}

          {event.type === "tool_call" && (
            <div className="flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-neutral-800/50 transition-colors">
              <ToolIcon name={event.name} />
              <div className="min-w-0">
                <span className="text-neutral-200 font-medium">
                  {TOOL_LABELS[event.name]?.label || event.name}
                </span>
                <div className="text-neutral-600 truncate mt-0.5">
                  {formatArgs(event.args)}
                </div>
              </div>
            </div>
          )}

          {event.type === "tool_result" && (
            <div className="flex items-start gap-2 py-1 px-2 pl-9">
              <span className="text-emerald-500 shrink-0">&#10003;</span>
              <span className="text-neutral-400">{event.summary}</span>
            </div>
          )}

          {event.type === "thinking" && (
            <div className="py-1 px-2 pl-4 border-l-2 border-neutral-800 ml-2">
              <span className="text-neutral-500 italic">{event.content.slice(0, 200)}</span>
            </div>
          )}

          {event.type === "graph_update" && (
            <div className="flex items-center gap-2 py-0.5 px-2 pl-9">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-glow" />
              <span className="text-emerald-400/70 text-[10px]">+{event.nodesAdded} nodes added to graph</span>
            </div>
          )}

          {event.type === "error" && (
            <div className="flex items-start gap-2 py-1.5 px-2 rounded-md bg-red-500/10 border border-red-500/20 my-1">
              <span className="text-red-400 shrink-0">!</span>
              <span className="text-red-300">{event.message}</span>
            </div>
          )}

          {event.type === "complete" && (
            <div className="flex items-center gap-2 py-2 px-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 my-1 animate-scale-in">
              <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">&#10003;</span>
              <div>
                <span className="text-emerald-400 font-semibold">Brief generated</span>
                <span className="text-neutral-400 ml-2">GEO Score: {event.brief.geoScore.overall}/100</span>
              </div>
            </div>
          )}
        </div>
      ))}
      {isRunning && events.length > 0 && events[events.length - 1].type !== "complete" && (
        <TypingIndicator />
      )}
    </div>
  );
}
