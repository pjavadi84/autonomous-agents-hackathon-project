import { describe, it, expect } from "vitest";
import { addBrief, getBrief, listBriefs } from "../store";
import type { ContentBrief } from "@/lib/agent/types";

function makeBrief(id: string, generatedAt: string): ContentBrief {
  return {
    id,
    metadata: {
      location: "Test",
      topic: "Test",
      contentType: "market_report",
      generatedAt,
      dataFreshness: "current",
      sourcesCount: 0,
      signalsCount: 0,
    },
    geoScore: { overall: 50, breakdown: { dataBackedClaims: 10, structuredData: 10, contentStructure: 10, freshness: 10, originalInsights: 5, sourceAuthority: 5 } },
    title: `Brief ${id}`,
    metaDescription: "Test brief",
    targetKeywords: [],
    outline: [],
    dataClaims: [],
    faqSection: [],
    jsonLd: { article: {}, faqPage: {}, breadcrumbList: {} },
    sources: [],
    competitorGaps: [],
    llmCitabilityTips: [],
  };
}

describe("store", () => {
  it("stores and retrieves a brief by id", () => {
    const brief = makeBrief("store_test_1", "2026-01-01T00:00:00Z");
    addBrief(brief);
    expect(getBrief("store_test_1")).toEqual(brief);
  });

  it("returns undefined for non-existent brief", () => {
    expect(getBrief("nonexistent_xyz")).toBeUndefined();
  });

  it("listBriefs returns briefs sorted by generatedAt descending", () => {
    addBrief(makeBrief("sort_old", "2020-01-01T00:00:00Z"));
    addBrief(makeBrief("sort_new", "2099-01-01T00:00:00Z"));
    addBrief(makeBrief("sort_mid", "2050-06-15T00:00:00Z"));

    const list = listBriefs();
    // Find our test briefs in the list (store may have others from prior tests)
    const sortNew = list.findIndex((b) => b.id === "sort_new");
    const sortMid = list.findIndex((b) => b.id === "sort_mid");
    const sortOld = list.findIndex((b) => b.id === "sort_old");

    expect(sortNew).toBeLessThan(sortMid);
    expect(sortMid).toBeLessThan(sortOld);
  });
});
