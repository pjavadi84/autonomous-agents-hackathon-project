import { describe, it, expect } from "vitest";
import { generateArticleSchema, generateFaqSchema, generateBreadcrumbSchema } from "../jsonld";
import type { ContentBrief } from "@/lib/agent/types";

const brief: ContentBrief = {
  id: "test_1",
  metadata: {
    location: "Irvine, CA",
    topic: "Investment Analysis",
    contentType: "investment_analysis",
    generatedAt: "2026-02-27T12:00:00.000Z",
    dataFreshness: "current",
    sourcesCount: 1,
    signalsCount: 3,
  },
  geoScore: { overall: 70, breakdown: { dataBackedClaims: 10, structuredData: 20, contentStructure: 15, freshness: 10, originalInsights: 10, sourceAuthority: 5 } },
  title: "Irvine Real Estate Investment Analysis 2026",
  metaDescription: "Investment analysis for Irvine CA real estate in 2026.",
  targetKeywords: ["irvine investment", "irvine real estate"],
  outline: [
    { h2: "Market Overview", h3s: [], keyPoints: ["Strong market"], dataClaims: [] },
    { h2: "ROI Analysis", h3s: ["Rental Yields"], keyPoints: ["5% cap rate"], dataClaims: [] },
  ],
  dataClaims: [],
  faqSection: [
    { question: "Is Irvine good for investment?", answer: "Yes, strong appreciation." },
    { question: "What is the cap rate?", answer: "Approximately 5%." },
  ],
  jsonLd: { article: {}, faqPage: {}, breadcrumbList: {} },
  sources: [],
  competitorGaps: [],
  llmCitabilityTips: [],
};

describe("generateArticleSchema", () => {
  it("returns valid Article schema with required fields", () => {
    const schema = generateArticleSchema(brief);
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Article");
    expect(schema.headline).toBe(brief.title);
    expect(schema.description).toBe(brief.metaDescription);
  });

  it("includes location as Place in about field", () => {
    const schema = generateArticleSchema(brief);
    const about = schema.about as Record<string, string>;
    expect(about["@type"]).toBe("Place");
    expect(about.name).toBe("Irvine, CA");
  });

  it("maps outline H2s to articleSection", () => {
    const schema = generateArticleSchema(brief);
    expect(schema.articleSection).toEqual(["Market Overview", "ROI Analysis"]);
  });

  it("includes datePublished from metadata", () => {
    const schema = generateArticleSchema(brief);
    expect(schema.datePublished).toBe("2026-02-27T12:00:00.000Z");
  });

  it("includes keywords as comma-separated string", () => {
    const schema = generateArticleSchema(brief);
    expect(schema.keywords).toBe("irvine investment, irvine real estate");
  });
});

describe("generateFaqSchema", () => {
  it("returns valid FAQPage schema", () => {
    const schema = generateFaqSchema(brief);
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("FAQPage");
  });

  it("maps FAQ entries to Question/Answer pairs", () => {
    const schema = generateFaqSchema(brief);
    const entities = schema.mainEntity as Array<Record<string, unknown>>;
    expect(entities).toHaveLength(2);
    expect(entities[0]["@type"]).toBe("Question");
    expect(entities[0].name).toBe("Is Irvine good for investment?");
    const answer = entities[0].acceptedAnswer as Record<string, string>;
    expect(answer["@type"]).toBe("Answer");
    expect(answer.text).toBe("Yes, strong appreciation.");
  });

  it("returns empty object when no FAQ entries", () => {
    const emptyBrief = { ...brief, faqSection: [] };
    const schema = generateFaqSchema(emptyBrief);
    expect(Object.keys(schema)).toHaveLength(0);
  });
});

describe("generateBreadcrumbSchema", () => {
  it("returns valid BreadcrumbList schema", () => {
    const schema = generateBreadcrumbSchema(brief);
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("BreadcrumbList");
  });

  it("generates 3-level breadcrumb: Home > Location > Title", () => {
    const schema = generateBreadcrumbSchema(brief);
    const items = schema.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(3);
    expect(items[0].name).toBe("Home");
    expect(items[1].name).toBe("Irvine, CA");
    expect(items[2].name).toBe(brief.title);
  });

  it("generates URL-safe slug for location", () => {
    const schema = generateBreadcrumbSchema(brief);
    const items = schema.itemListElement as Array<Record<string, unknown>>;
    expect(items[1].item).toBe("/irvine-ca");
  });
});
