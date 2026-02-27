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
  Location: "#ef4444",
  Neighborhood: "#3b82f6",
  MarketSignal: "#f97316",
  Source: "#6b7280",
  Amenity: "#22c55e",
  ContentBrief: "#a855f7",
};

export default function GraphViz({ refreshTrigger }: { refreshTrigger: number }) {
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphEdge[] }>({ nodes: [], links: [] });
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

  const fetchGraph = useCallback(async () => {
    try {
      const res = await fetch("/api/graph");
      const data = await res.json();
      if (data.nodes) {
        setGraphData({
          nodes: data.nodes.map((n: GraphNode) => ({ ...n })),
          links: data.edges?.map((e: GraphEdge) => ({ ...e })) || [],
        });
      }
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [refreshTrigger, fetchGraph]);

  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setDimensions({ width: clientWidth, height: clientHeight });
    }
  }, []);

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
        <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
          Knowledge graph will appear here...
        </div>
      ) : (
        <>
          <ForceGraph2D
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            nodeColor={nodeColor}
            nodeLabel={nodeLabel}
            nodeRelSize={6}
            linkColor={() => "#404040"}
            linkWidth={1}
            backgroundColor="#0a0a0a"
            nodeCanvasObjectMode={() => "after"}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const n = node as GraphNode & { x: number; y: number };
              const fontSize = Math.max(10 / globalScale, 3);
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "#d4d4d4";
              const label = n.name?.length > 15 ? n.name.slice(0, 15) + "..." : n.name || "";
              ctx.fillText(label, n.x, n.y + 10);
            }}
          />
          {/* Legend */}
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-2">
            {Object.entries(LABEL_COLORS).map(([label, color]) => (
              <div key={label} className="flex items-center gap-1 text-[10px] text-neutral-400">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
