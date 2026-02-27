"use client";

import type { ContentBrief } from "@/lib/agent/types";
import GeoScoreBadge from "./geo-score-badge";

export default function BriefViewer({ brief }: { brief: ContentBrief }) {
  return (
    <div className="space-y-6 text-sm">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">{brief.title}</h2>
        <p className="text-neutral-400 mt-1">{brief.metaDescription}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {brief.targetKeywords.map((kw) => (
            <span key={kw} className="px-2 py-0.5 bg-neutral-800 text-neutral-300 text-xs rounded-full">
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* GEO Score */}
      <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
        <h3 className="text-sm font-semibold text-neutral-300 mb-3">GEO Citability Score</h3>
        <GeoScoreBadge score={brief.geoScore} />
      </div>

      {/* Outline */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-300 mb-2">Content Outline</h3>
        <div className="space-y-3">
          {brief.outline.map((section, i) => (
            <div key={i} className="bg-neutral-900 rounded-lg p-3 border border-neutral-800">
              <h4 className="font-medium text-white">{section.h2}</h4>
              {section.h3s && section.h3s.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {section.h3s.map((h3, j) => (
                    <div key={j} className="text-neutral-400 text-xs pl-3">• {h3}</div>
                  ))}
                </div>
              )}
              {section.keyPoints.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {section.keyPoints.map((point, j) => (
                    <li key={j} className="text-neutral-300 text-xs">→ {point}</li>
                  ))}
                </ul>
              )}
              {section.dataClaims.length > 0 && (
                <div className="mt-2 space-y-1">
                  {section.dataClaims.map((claim, j) => (
                    <div key={j} className="text-xs bg-neutral-800 rounded p-2">
                      <span className="text-emerald-400">📊 {claim.claim}</span>
                      <div className="text-neutral-500 mt-0.5">
                        Source: {claim.sourceTitle} ({claim.confidence})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      {brief.faqSection.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-300 mb-2">FAQ Section</h3>
          <div className="space-y-2">
            {brief.faqSection.map((faq, i) => (
              <details key={i} className="bg-neutral-900 rounded-lg border border-neutral-800">
                <summary className="p-3 cursor-pointer text-white font-medium text-xs">
                  {faq.question}
                </summary>
                <div className="px-3 pb-3 text-neutral-300 text-xs">{faq.answer}</div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* JSON-LD */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-300 mb-2">JSON-LD Structured Data</h3>
        <div className="space-y-2">
          {Object.entries(brief.jsonLd).map(([key, schema]) => {
            if (!schema || Object.keys(schema).length === 0) return null;
            return (
              <details key={key} className="bg-neutral-900 rounded-lg border border-neutral-800">
                <summary className="p-3 cursor-pointer text-neutral-300 text-xs font-mono">
                  {key} schema
                </summary>
                <pre className="px-3 pb-3 text-[10px] text-neutral-400 overflow-x-auto">
                  {JSON.stringify(schema, null, 2)}
                </pre>
              </details>
            );
          })}
        </div>
      </div>

      {/* Sources */}
      {brief.sources.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-300 mb-2">
            Sources ({brief.sources.length})
          </h3>
          <div className="space-y-1">
            {brief.sources.map((source, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-neutral-500 w-4">{i + 1}.</span>
                <div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {source.title}
                  </a>
                  <span className="text-neutral-600 ml-1">({source.credibilityNote})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitor Gaps + Tips */}
      {brief.competitorGaps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-300 mb-2">Competitor Gaps</h3>
          <ul className="space-y-1">
            {brief.competitorGaps.map((gap, i) => (
              <li key={i} className="text-xs text-neutral-400">• {gap}</li>
            ))}
          </ul>
        </div>
      )}

      {brief.llmCitabilityTips.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-300 mb-2">LLM Citability Tips</h3>
          <ul className="space-y-1">
            {brief.llmCitabilityTips.map((tip, i) => (
              <li key={i} className="text-xs text-neutral-400">• {tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Metadata */}
      <div className="text-[10px] text-neutral-600 border-t border-neutral-800 pt-2">
        Generated: {brief.metadata.generatedAt} | {brief.metadata.sourcesCount} sources | {brief.metadata.signalsCount} data points | {brief.metadata.dataFreshness}
      </div>
    </div>
  );
}
