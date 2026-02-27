"use client";

import type { GeoScore } from "@/lib/agent/types";

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return "stroke-emerald-400";
  if (score >= 60) return "stroke-yellow-400";
  if (score >= 40) return "stroke-orange-400";
  return "stroke-red-400";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  return "Poor";
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
    <div className="flex flex-col items-center gap-4">
      {/* Circular gauge */}
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#262626" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            className={getScoreRingColor(score.overall)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${getScoreColor(score.overall)}`}>
            {score.overall}
          </span>
          <span className="text-neutral-500 text-xs">{getScoreLabel(score.overall)}</span>
        </div>
      </div>

      {/* Dimension bars */}
      <div className="w-full space-y-2">
        {dimensions.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400 w-28 text-right">{d.label}</span>
            <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getScoreRingColor(((d.value / d.max) * 100)).replace("stroke-", "bg-")}`}
                style={{ width: `${(d.value / d.max) * 100}%`, transition: "width 1s ease-out" }}
              />
            </div>
            <span className="text-neutral-500 w-8">{d.value}/{d.max}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
