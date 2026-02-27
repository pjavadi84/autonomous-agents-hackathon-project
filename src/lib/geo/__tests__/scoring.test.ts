import { describe, it, expect } from "vitest";
import { computeGeoScore, getWeakestDimension } from "../scoring";
import type { ContentBrief } from "@/lib/agent/types";

function makeBrief(overrides: Partial<ContentBrief> = {}): ContentBrief {
  return {
    id: "test_1",
    metadata: {
      location: "San Francisco, CA",
      topic: "Market Report",
      contentType: "market_report",
      generatedAt: new Date().toISOString(),
      dataFreshness: "current",
      sourcesCount: 2,
      signalsCount: 5,
    },
    geoScore: { overall: 0, breakdown: { dataBackedClaims: 0, structuredData: 0, contentStructure: 0, freshness: 0, originalInsights: 0, sourceAuthority: 0 } },
    title: "SF Market Report 2026",
    metaDescription: "A comprehensive look at the San Francisco real estate market in 2026 with current data on prices and trends for buyers.",
    targetKeywords: ["sf real estate", "sf market 2026"],
    outline: [
      {
        h2: "Market Overview",
        h3s: ["Price Trends", "Inventory"],
        keyPoints: ["Prices are up 9%"],
        dataClaims: [
          { claim: "Median price is $1.4M in 2026", value: "$1.4M", sourceUrl: "https://zillow.com/data", sourceTitle: "Zillow", confidence: "high" },
        ],
      },
      {
        h2: "Neighborhood Analysis",
        h3s: ["Mission District"],
        keyPoints: ["Mission is hot"],
        dataClaims: [
          { claim: "Mission median up 12% in 2026", value: "12%", sourceUrl: "https://redfin.com/sf", sourceTitle: "Redfin", confidence: "high" },
        ],
      },
      {
        h2: "Investment Outlook",
        h3s: [],
        keyPoints: ["Strong ROI potential"],
        dataClaims: [],
      },
    ],
    dataClaims: [
      { claim: "Median price is $1.4M in 2026", value: "$1.4M", sourceUrl: "https://zillow.com/data", sourceTitle: "Zillow", confidence: "high" },
      { claim: "Mission median up 12% in 2026", value: "12%", sourceUrl: "https://redfin.com/sf", sourceTitle: "Redfin", confidence: "high" },
    ],
    faqSection: [
      { question: "What is the median price?", answer: "$1.4M as of 2026" },
      { question: "Is it a buyer's market?", answer: "Not currently" },
      { question: "Best neighborhoods?", answer: "Mission, SOMA, Marina" },
    ],
    jsonLd: {
      article: { "@type": "Article" },
      faqPage: { "@type": "FAQPage" },
      breadcrumbList: { "@type": "BreadcrumbList" },
    },
    sources: [
      { url: "https://zillow.com/data", title: "Zillow", domain: "zillow.com", usedForClaims: ["price"], credibilityNote: "Major marketplace" },
      { url: "https://redfin.com/sf", title: "Redfin", domain: "redfin.com", usedForClaims: ["trends"], credibilityNote: "Major brokerage" },
    ],
    competitorGaps: ["Missing neighborhood-level data"],
    llmCitabilityTips: ["Use structured data"],
    ...overrides,
  };
}

describe("computeGeoScore", () => {
  it("returns a score between 0 and 100", () => {
    const brief = makeBrief();
    const score = computeGeoScore(brief);
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
  });

  it("overall equals sum of all breakdown dimensions", () => {
    const brief = makeBrief();
    const score = computeGeoScore(brief);
    const sum = Object.values(score.breakdown).reduce((a, b) => a + b, 0);
    expect(score.overall).toBe(sum);
  });

  it("scores dataBackedClaims at 2 points per claim, max 20", () => {
    const brief = makeBrief({ dataClaims: Array(15).fill({ claim: "test", value: "1", sourceUrl: "https://test.com", sourceTitle: "Test", confidence: "high" as const }) });
    const score = computeGeoScore(brief);
    expect(score.breakdown.dataBackedClaims).toBe(20); // 15 * 2 = 30, capped at 20
  });

  it("scores 0 dataBackedClaims when no claims", () => {
    const brief = makeBrief({ dataClaims: [] });
    const score = computeGeoScore(brief);
    expect(score.breakdown.dataBackedClaims).toBe(0);
  });

  it("gives full structuredData score (20) when all 3 JSON-LD schemas present", () => {
    const brief = makeBrief();
    const score = computeGeoScore(brief);
    expect(score.breakdown.structuredData).toBe(20);
  });

  it("gives partial structuredData score when schemas missing", () => {
    const brief = makeBrief({ jsonLd: { article: { "@type": "Article" }, faqPage: {}, breadcrumbList: {} } });
    const score = computeGeoScore(brief);
    expect(score.breakdown.structuredData).toBe(5); // only article
  });

  it("gives 0 structuredData when all schemas empty", () => {
    const brief = makeBrief({ jsonLd: { article: {}, faqPage: {}, breadcrumbList: {} } });
    const score = computeGeoScore(brief);
    expect(score.breakdown.structuredData).toBe(0);
  });

  it("scores contentStructure higher with FAQ, outline, H3s, and data claims", () => {
    const richBrief = makeBrief();
    const poorBrief = makeBrief({
      faqSection: [],
      outline: [{ h2: "One section", h3s: [], keyPoints: [], dataClaims: [] }],
      metaDescription: "Short",
    });
    const richScore = computeGeoScore(richBrief);
    const poorScore = computeGeoScore(poorBrief);
    expect(richScore.breakdown.contentStructure).toBeGreaterThan(poorScore.breakdown.contentStructure);
  });

  it("scores sourceAuthority higher for authoritative domains", () => {
    const govBrief = makeBrief({
      sources: [
        { url: "https://census.gov/data", title: "Census", domain: "census.gov", usedForClaims: [], credibilityNote: "" },
        { url: "https://hud.gov/data", title: "HUD", domain: "hud.gov", usedForClaims: [], credibilityNote: "" },
      ],
    });
    const blogBrief = makeBrief({
      sources: [
        { url: "https://randomblog.com/post", title: "Blog", domain: "randomblog.com", usedForClaims: [], credibilityNote: "" },
      ],
    });
    const govScore = computeGeoScore(govBrief);
    const blogScore = computeGeoScore(blogBrief);
    expect(govScore.breakdown.sourceAuthority).toBeGreaterThan(blogScore.breakdown.sourceAuthority);
  });

  it("scores 0 sourceAuthority when no sources", () => {
    const brief = makeBrief({ sources: [] });
    const score = computeGeoScore(brief);
    expect(score.breakdown.sourceAuthority).toBe(0);
  });

  it("scores originalInsights based on competitor gaps and source diversity", () => {
    const brief = makeBrief();
    const score = computeGeoScore(brief);
    expect(score.breakdown.originalInsights).toBeGreaterThan(0);
  });

  it("gives low originalInsights when no gaps and single source", () => {
    const brief = makeBrief({
      competitorGaps: [],
      dataClaims: [{ claim: "test", value: "1", sourceUrl: "https://only.com", sourceTitle: "Only", confidence: "high" }],
      outline: [{ h2: "Market Overview", h3s: [], keyPoints: [], dataClaims: [] }],
    });
    const score = computeGeoScore(brief);
    // No competitor gaps (0), single source (0), no neighborhood heading (0)
    expect(score.breakdown.originalInsights).toBe(0);
  });

  it("each dimension respects its maximum", () => {
    const brief = makeBrief();
    const score = computeGeoScore(brief);
    expect(score.breakdown.dataBackedClaims).toBeLessThanOrEqual(20);
    expect(score.breakdown.structuredData).toBeLessThanOrEqual(20);
    expect(score.breakdown.contentStructure).toBeLessThanOrEqual(20);
    expect(score.breakdown.freshness).toBeLessThanOrEqual(15);
    expect(score.breakdown.originalInsights).toBeLessThanOrEqual(15);
    expect(score.breakdown.sourceAuthority).toBeLessThanOrEqual(10);
  });
});

describe("getWeakestDimension", () => {
  it("returns the dimension with the lowest percentage of its max", () => {
    const score = {
      overall: 50,
      breakdown: {
        dataBackedClaims: 20,  // 100%
        structuredData: 20,     // 100%
        contentStructure: 10,   // 50%
        freshness: 0,           // 0% — weakest
        originalInsights: 0,    // 0% — tied, but freshness comes first in iteration
        sourceAuthority: 0,     // 0%
      },
    };
    const weakest = getWeakestDimension(score);
    expect(["freshness", "originalInsights", "sourceAuthority"]).toContain(weakest);
  });

  it("returns a valid dimension name", () => {
    const brief = makeBrief();
    const score = computeGeoScore(brief);
    const weakest = getWeakestDimension(score);
    expect(Object.keys(score.breakdown)).toContain(weakest);
  });
});
