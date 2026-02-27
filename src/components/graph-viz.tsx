"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface GraphNode {
  id: string;
  label: string;
  name: string;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

const LABEL_COLORS: Record<string, string> = {
  Location: "#3b82f6",
  Neighborhood: "#a855f7",
  MarketSignal: "#22c55e",
  Source: "#f59e0b",
  Amenity: "#ec4899",
  ContentBrief: "#06b6d4",
};

export default function GraphViz({ refreshTrigger }: { refreshTrigger: number }) {
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphEdge[] }>({ nodes: [], links: [] });
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

  // Resize observer for responsive sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchGraph() {
      try {
        const res = await fetch("/api/graph");
        const data = await res.json();
        if (!cancelled && data.nodes) {
          setGraphData({
            nodes: data.nodes.map((n: GraphNode) => ({ ...n })),
            links: data.edges?.map((e: GraphEdge) => ({ ...e })) || [],
          });
        }
      } catch {
        // Silent fail
      }
    }
    fetchGraph();
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  const nodeColor = useCallback((node: object) => {
    const n = node as GraphNode;
    return LABEL_COLORS[n.label] || "#ffffff";
  }, []);

  const nodeLabel = useCallback((node: object) => {
    const n = node as GraphNode;
    return `${n.label}: ${n.name}`;
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full relative">
      {graphData.nodes.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-neutral-600 text-sm gap-3">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-30">
            <circle cx="12" cy="12" r="4" stroke="#666" strokeWidth="1.5" />
            <circle cx="36" cy="12" r="4" stroke="#666" strokeWidth="1.5" />
            <circle cx="24" cy="36" r="4" stroke="#666" strokeWidth="1.5" />
            <line x1="15.5" y1="14" x2="21" y2="33" stroke="#444" strokeWidth="1" />
            <line x1="32.5" y1="14" x2="27" y2="33" stroke="#444" strokeWidth="1" />
            <line x1="16" y1="12" x2="32" y2="12" stroke="#444" strokeWidth="1" />
          </svg>
          <span>Knowledge graph will populate here...</span>
        </div>
      ) : (
        <>
          <ForceGraph2D
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            nodeColor={nodeColor}
            nodeLabel={nodeLabel}
            nodeRelSize={5}
            linkColor={() => "#2a2a2a"}
            linkWidth={0.5}
            backgroundColor="#0a0a0a"
            nodeCanvasObjectMode={() => "after"}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const n = node as GraphNode & { x: number; y: number };
              const fontSize = Math.max(10 / globalScale, 2.5);
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "rgba(200, 200, 200, 0.7)";
              const label = n.name?.length > 18 ? n.name.slice(0, 18) + "..." : n.name || "";
              ctx.fillText(label, n.x, n.y + 8);
            }}
          />
          {/* Legend */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-x-3 gap-y-1 bg-neutral-900/80 backdrop-blur-sm rounded-md px-2.5 py-1.5 border border-neutral-800/50">
            {Object.entries(LABEL_COLORS).map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                {label}
              </div>
            ))}
          </div>
          {/* Node count */}
          <div className="absolute top-3 right-3 text-[10px] text-neutral-600 bg-neutral-900/80 backdrop-blur-sm rounded px-2 py-1 border border-neutral-800/50 tabular-nums">
            {graphData.nodes.length} nodes &middot; {graphData.links.length} edges
          </div>
        </>
      )}
    </div>
  );
}
