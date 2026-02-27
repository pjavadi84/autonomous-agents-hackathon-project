"use client";

import type { ContentBrief } from "@/lib/agent/types";
import GeoScoreBadge from "./geo-score-badge";

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-neutral-900/50 rounded-lg p-4 border border-neutral-800/50 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">{children}</h3>;
}

export function BriefSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-6 bg-neutral-800 rounded w-3/4 mb-2" />
        <div className="h-4 bg-neutral-800/60 rounded w-full mb-3" />
        <div className="flex gap-2">
          <div className="h-5 bg-neutral-800/40 rounded-full w-20" />
          <div className="h-5 bg-neutral-800/40 rounded-full w-24" />
          <div className="h-5 bg-neutral-800/40 rounded-full w-16" />
        </div>
      </div>
      <div className="bg-neutral-900/50 rounded-lg p-4 border border-neutral-800/50">
        <div className="flex justify-center">
          <div className="w-28 h-28 rounded-full bg-neutral-800/60" />
        </div>
        <div className="mt-4 space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 bg-neutral-800/40 rounded w-24" />
              <div className="flex-1 h-1.5 bg-neutral-800/40 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-neutral-900/50 rounded-lg p-4 border border-neutral-800/50">
          <div className="h-4 bg-neutral-800/60 rounded w-2/3 mb-2" />
          <div className="h-3 bg-neutral-800/40 rounded w-full mb-1" />
          <div className="h-3 bg-neutral-800/40 rounded w-5/6" />
        </div>
      ))}
    </div>
  );
}

export default function BriefViewer({ brief }: { brief: ContentBrief }) {
  return (
    <div className="space-y-5 text-sm animate-slide-up">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white leading-snug">{brief.title}</h2>
        <p className="text-neutral-400 text-xs mt-1.5 leading-relaxed">{brief.metaDescription}</p>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {brief.targetKeywords.map((kw) => (
            <span key={kw} className="px-2 py-0.5 bg-neutral-800/60 text-neutral-400 text-[10px] rounded-full border border-neutral-700/50">
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* GEO Score */}
      <SectionCard>
        <SectionTitle>GEO Citability Score</SectionTitle>
        <GeoScoreBadge score={brief.geoScore} />
      </SectionCard>

      {/* Outline */}
      <div>
        <SectionTitle>Content Outline</SectionTitle>
        <div className="space-y-2.5">
          {brief.outline.map((section, i) => (
            <SectionCard key={i} className="space-y-2">
              <h4 className="font-medium text-white text-sm">{section.h2}</h4>
              {section.h3s && section.h3s.length > 0 && (
                <div className="space-y-0.5">
                  {section.h3s.map((h3, j) => (
                    <div key={j} className="text-neutral-500 text-[11px] pl-3 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-neutral-600 shrink-0" />
                      {h3}
                    </div>
                  ))}
                </div>
              )}
              {section.keyPoints.length > 0 && (
                <ul className="space-y-1">
                  {section.keyPoints.map((point, j) => (
                    <li key={j} className="text-neutral-300 text-[11px] flex items-start gap-1.5">
                      <span className="text-neutral-600 mt-0.5 shrink-0">&rarr;</span>
                      {point}
                    </li>
                  ))}
                </ul>
              )}
              {section.dataClaims.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {section.dataClaims.map((claim, j) => (
                    <div key={j} className="text-[11px] bg-emerald-500/5 border border-emerald-500/10 rounded-md p-2">
                      <div className="text-emerald-300 leading-relaxed">{claim.claim}</div>
                      <div className="text-neutral-600 mt-1 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-neutral-600 shrink-0" />
                        {claim.sourceTitle}
                        <span className="text-neutral-700 ml-auto">{claim.confidence}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          ))}
        </div>
      </div>

      {/* FAQ */}
      {brief.faqSection.length > 0 && (
        <div>
          <SectionTitle>FAQ Section</SectionTitle>
          <div className="space-y-1.5">
            {brief.faqSection.map((faq, i) => (
              <details key={i} className="group bg-neutral-900/50 rounded-lg border border-neutral-800/50">
                <summary className="p-3 cursor-pointer text-white font-medium text-xs hover:bg-neutral-800/30 transition-colors rounded-lg">
                  {faq.question}
                </summary>
                <div className="px-3 pb-3 text-neutral-400 text-[11px] leading-relaxed border-t border-neutral-800/30 pt-2 mt-1">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* JSON-LD */}
      <div>
        <SectionTitle>JSON-LD Structured Data</SectionTitle>
        <div className="space-y-1.5">
          {Object.entries(brief.jsonLd).map(([key, schema]) => {
            if (!schema || Object.keys(schema).length === 0) return null;
            return (
              <details key={key} className="group bg-neutral-900/50 rounded-lg border border-neutral-800/50">
                <summary className="p-3 cursor-pointer text-neutral-300 text-xs font-mono hover:bg-neutral-800/30 transition-colors rounded-lg flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                  {key}
                </summary>
                <pre className="px-3 pb-3 text-[10px] text-neutral-500 overflow-x-auto leading-relaxed">
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
          <SectionTitle>Sources ({brief.sources.length})</SectionTitle>
          <div className="space-y-1.5">
            {brief.sources.map((source, i) => (
              <div key={i} className="flex items-start gap-2.5 text-[11px]">
                <span className="text-neutral-600 w-4 text-right tabular-nums shrink-0">{i + 1}.</span>
                <div className="min-w-0">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                  >
                    {source.title}
                  </a>
                  <div className="text-neutral-600 mt-0.5">{source.credibilityNote}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitor Gaps + Tips */}
      <div className="grid grid-cols-1 gap-3">
        {brief.competitorGaps.length > 0 && (
          <SectionCard>
            <SectionTitle>Competitor Gaps</SectionTitle>
            <ul className="space-y-1.5">
              {brief.competitorGaps.map((gap, i) => (
                <li key={i} className="text-[11px] text-neutral-400 flex items-start gap-1.5">
                  <span className="text-orange-400/60 shrink-0 mt-0.5">&bull;</span>
                  {gap}
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {brief.llmCitabilityTips.length > 0 && (
          <SectionCard>
            <SectionTitle>LLM Citability Tips</SectionTitle>
            <ul className="space-y-1.5">
              {brief.llmCitabilityTips.map((tip, i) => (
                <li key={i} className="text-[11px] text-neutral-400 flex items-start gap-1.5">
                  <span className="text-cyan-400/60 shrink-0 mt-0.5">&bull;</span>
                  {tip}
                </li>
              ))}
            </ul>
          </SectionCard>
        )}
      </div>

      {/* Metadata footer */}
      <div className="text-[10px] text-neutral-600 border-t border-neutral-800/50 pt-3 flex flex-wrap gap-x-3 gap-y-0.5">
        <span>Generated: {new Date(brief.metadata.generatedAt).toLocaleString()}</span>
        <span>{brief.metadata.sourcesCount} sources</span>
        <span>{brief.metadata.signalsCount} data points</span>
        <span>{brief.metadata.dataFreshness}</span>
      </div>
    </div>
  );
}
