"use client";

import type { GeoScore } from "@/lib/agent/types";

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  return "Poor";
}

function getBarColor(percent: number): string {
  if (percent >= 80) return "bg-emerald-400";
  if (percent >= 60) return "bg-yellow-400";
  if (percent >= 40) return "bg-orange-400";
  return "bg-red-400";
}

function getRingStroke(score: number): string {
  if (score >= 80) return "#34d399";
  if (score >= 60) return "#facc15";
  if (score >= 40) return "#fb923c";
  return "#f87171";
}

export default function GeoScoreBadge({ score }: { score: GeoScore }) {
  const circumference = 2 * Math.PI * 45;
  const progress = (score.overall / 100) * circumference;

  const dimensions = [
    { label: "Data Claims", value: score.breakdown.dataBackedClaims, max: 20 },
    { label: "Structured Data", value: score.breakdown.structuredData, max: 20 },
    { label: "Content Structure", value: score.breakdown.contentStructure, max: 20 },
    { label: "Freshness", value: score.breakdown.freshness, max: 15 },
    { label: "Original Insights", value: score.breakdown.originalInsights, max: 15 },
    { label: "Source Authority", value: score.breakdown.sourceAuthority, max: 10 },
  ];

  return (
    <div className="flex flex-col items-center gap-4 animate-scale-in">
      {/* Circular gauge */}
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1a1a1a" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke={getRingStroke(score.overall)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: "stroke-dashoffset 1.2s ease-out, stroke 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold tabular-nums ${getScoreColor(score.overall)}`}>
            {score.overall}
          </span>
          <span className="text-neutral-500 text-[10px] font-medium">{getScoreLabel(score.overall)}</span>
        </div>
      </div>

      {/* Dimension bars */}
      <div className="w-full space-y-1.5">
        {dimensions.map((d) => {
          const percent = (d.value / d.max) * 100;
          return (
            <div key={d.label} className="flex items-center gap-2 text-[11px]">
              <span className="text-neutral-500 w-28 text-right truncate">{d.label}</span>
              <div className="flex-1 h-1.5 bg-neutral-800/80 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getBarColor(percent)}`}
                  style={{ width: `${percent}%`, transition: "width 1s ease-out 0.3s" }}
                />
              </div>
              <span className="text-neutral-600 w-8 tabular-nums">{d.value}/{d.max}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
