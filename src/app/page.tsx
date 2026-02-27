"use client";

import { useState, useCallback } from "react";
import InputForm from "@/components/input-form";
import AgentConsole from "@/components/agent-console";
import StepIndicator from "@/components/step-indicator";
import GraphViz from "@/components/graph-viz";
import BriefViewer, { BriefSkeleton } from "@/components/brief-viewer";
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

  // Landing page
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center relative overflow-hidden">
        {/* Background dot grid */}
        <div className="absolute inset-0 bg-dot-grid opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-transparent to-neutral-950" />

        <div className="max-w-lg w-full px-6 relative z-10">
          <div className="text-center mb-8 animate-slide-up">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent animate-gradient pb-1">
              GeoAgent
            </h1>
            <p className="text-neutral-400 mt-3 text-sm leading-relaxed">
              Autonomous AI agent that produces GEO-optimized content briefs<br />
              for real estate market intelligence
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              {["Grok", "Gemini", "Tavily", "Neo4j"].map((name) => (
                <span key={name} className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800/60 text-neutral-500 border border-neutral-700/30">
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-neutral-900/80 backdrop-blur-sm rounded-xl p-6 border border-neutral-800/60 shadow-2xl animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <InputForm onSubmit={handleSubmit} isRunning={isRunning} />
          </div>

          <div className="text-center mt-8 text-neutral-700 text-[10px] animate-fade-in" style={{ animationDelay: "0.3s" }}>
            Built for SF Autonomous Agents Hackathon 2026
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Top bar */}
      <div className="border-b border-neutral-800/60 px-4 py-2.5 flex items-center justify-between bg-neutral-900/30 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            GeoAgent
          </h1>
          <StepIndicator currentPhase={currentPhase} />
        </div>
        <button
          onClick={() => { setHasStarted(false); setEvents([]); setCompletedBrief(null); setCurrentPhase(null); }}
          className="text-[11px] text-neutral-500 hover:text-white transition-colors px-2.5 py-1 rounded-md hover:bg-neutral-800"
        >
          New Brief
        </button>
      </div>

      {/* Three-column layout — stacks on small screens */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-49px)]">
        {/* Left: Agent Console + Input */}
        <div className="lg:w-[35%] border-b lg:border-b-0 lg:border-r border-neutral-800/60 flex flex-col min-h-0">
          <div className="p-3 border-b border-neutral-800/40">
            <InputForm onSubmit={handleSubmit} isRunning={isRunning} />
          </div>
          <div className="flex-1 p-3 overflow-hidden min-h-0">
            <h2 className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-2">Agent Reasoning</h2>
            <div className="h-[calc(100%-20px)]">
              <AgentConsole events={events} isRunning={isRunning} />
            </div>
          </div>
        </div>

        {/* Center: Graph */}
        <div className="lg:w-[35%] border-b lg:border-b-0 lg:border-r border-neutral-800/60 flex flex-col min-h-0">
          <div className="p-3 pb-1.5">
            <h2 className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Knowledge Graph</h2>
          </div>
          <div className="flex-1 min-h-0">
            <GraphViz refreshTrigger={graphRefresh} />
          </div>
        </div>

        {/* Right: Brief */}
        <div className="lg:w-[30%] flex flex-col min-h-0">
          <div className="p-3 pb-1.5">
            <h2 className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Generated Brief</h2>
          </div>
          <div className="flex-1 p-3 pt-1 overflow-y-auto min-h-0">
            {completedBrief ? (
              <BriefViewer brief={completedBrief} />
            ) : isRunning ? (
              <BriefSkeleton />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-neutral-600 text-sm gap-2">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="opacity-30">
                  <rect x="4" y="4" width="24" height="28" rx="2" stroke="#666" strokeWidth="1.5" />
                  <line x1="8" y1="10" x2="24" y2="10" stroke="#444" strokeWidth="1" />
                  <line x1="8" y1="14" x2="20" y2="14" stroke="#444" strokeWidth="1" />
                  <line x1="8" y1="18" x2="22" y2="18" stroke="#444" strokeWidth="1" />
                  <line x1="8" y1="22" x2="16" y2="22" stroke="#444" strokeWidth="1" />
                </svg>
                <span>Brief will appear here...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
