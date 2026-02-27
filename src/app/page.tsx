"use client";

import { useState, useCallback } from "react";
import InputForm from "@/components/input-form";
import AgentConsole from "@/components/agent-console";
import StepIndicator from "@/components/step-indicator";
import GraphViz from "@/components/graph-viz";
import BriefViewer from "@/components/brief-viewer";
import type { AgentEvent, ContentBrief } from "@/lib/agent/types";

export default function Home() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<"research" | "connect" | "generate" | null>(null);
  const [completedBrief, setCompletedBrief] = useState<ContentBrief | null>(null);
  const [graphRefresh, setGraphRefresh] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const handleSubmit = useCallback(async (data: { location: string; topic: string; contentType: string }) => {
    setIsRunning(true);
    setEvents([]);
    setCompletedBrief(null);
    setCurrentPhase(null);
    setHasStarted(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to start agent");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event: AgentEvent = JSON.parse(line.slice(6));
              setEvents((prev) => [...prev, event]);

              if (event.type === "phase") {
                setCurrentPhase(event.phase);
              }
              if (event.type === "graph_update") {
                setGraphRefresh((prev) => prev + 1);
              }
              if (event.type === "complete") {
                setCompletedBrief(event.brief);
                setGraphRefresh((prev) => prev + 1);
              }
            } catch {
              // Skip malformed events
            }
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setEvents((prev) => [...prev, { type: "error", message: msg }]);
    } finally {
      setIsRunning(false);
    }
  }, []);

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="max-w-lg w-full px-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              GeoAgent
            </h1>
            <p className="text-neutral-400 mt-2">
              Real-time market intelligence for GEO-optimized real estate content
            </p>
            <p className="text-neutral-600 text-xs mt-1">
              Autonomous agent powered by Grok + Gemini + Tavily + Neo4j
            </p>
          </div>
          <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
            <InputForm onSubmit={handleSubmit} isRunning={isRunning} />
          </div>
          <div className="text-center mt-6 text-neutral-600 text-xs">
            Built for SF Autonomous Agents Hackathon 2026
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Top bar */}
      <div className="border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            GeoAgent
          </h1>
          <StepIndicator currentPhase={currentPhase} />
        </div>
        <button
          onClick={() => { setHasStarted(false); setEvents([]); setCompletedBrief(null); setCurrentPhase(null); }}
          className="text-xs text-neutral-500 hover:text-white transition-colors"
        >
          New Brief
        </button>
      </div>

      {/* Three-column layout */}
      <div className="flex h-[calc(100vh-57px)]">
        {/* Left: Agent Console + Input */}
        <div className="w-[35%] border-r border-neutral-800 flex flex-col">
          <div className="p-4 border-b border-neutral-800">
            <InputForm onSubmit={handleSubmit} isRunning={isRunning} />
          </div>
          <div className="flex-1 p-4 overflow-hidden">
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Agent Reasoning</h2>
            <div className="h-[calc(100%-24px)]">
              <AgentConsole events={events} />
            </div>
          </div>
        </div>

        {/* Center: Graph */}
        <div className="w-[35%] border-r border-neutral-800 flex flex-col">
          <div className="p-4 pb-2">
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Knowledge Graph</h2>
          </div>
          <div className="flex-1">
            <GraphViz refreshTrigger={graphRefresh} />
          </div>
        </div>

        {/* Right: Brief */}
        <div className="w-[30%] flex flex-col">
          <div className="p-4 pb-2">
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Generated Brief</h2>
          </div>
          <div className="flex-1 p-4 pt-0 overflow-y-auto">
            {completedBrief ? (
              <BriefViewer brief={completedBrief} />
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
                {isRunning ? "Waiting for brief generation..." : "Brief will appear here..."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
