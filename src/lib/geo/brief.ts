import gemini from "../llm/gemini";
import { ContentBrief, ContentType, DataClaim } from "../agent/types";
import { computeGeoScore } from "./scoring";
import { generateArticleSchema, generateFaqSchema, generateBreadcrumbSchema } from "./jsonld";
import { storeContentBrief } from "../neo4j/queries";

function generateId(): string {
  return `brief_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function generateContentBrief(params: {
  location: string;
  topic: string;
  contentType: ContentType;
  targetKeywords?: string[];
  graphContext: unknown;
}): Promise<ContentBrief> {
  const { location, topic, contentType, graphContext } = params;

  const prompt = `You are a GEO (Generative Engine Optimization) content strategist. Generate a comprehensive content brief that AI search engines (ChatGPT, Perplexity, Google AI Overviews) will want to cite.

LOCATION: ${location}
TOPIC: ${topic}
CONTENT TYPE: ${contentType}
KNOWLEDGE GRAPH DATA:
${JSON.stringify(graphContext, null, 2)}

Generate a JSON response with this exact structure:
{
  "title": "SEO-optimized H1 title (50-70 chars)",
  "metaDescription": "Compelling meta description (120-160 chars) with key data point",
  "targetKeywords": ["primary keyword", "secondary1", "secondary2", "long-tail1", "long-tail2"],
  "outline": [
    {
      "h2": "Section heading with keyword",
      "h3s": ["Subsection 1", "Subsection 2"],
      "keyPoints": ["Key point with specific data", "Another insight"],
      "dataClaims": [
        {
          "claim": "Specific factual statement with number",
          "value": "The specific number/metric",
          "sourceUrl": "URL from the knowledge graph data",
          "sourceTitle": "Source name",
          "confidence": "high or medium"
        }
      ]
    }
  ],
  "faqSection": [
    {
      "question": "Common question buyers/sellers would ask",
      "answer": "Data-driven answer referencing specific numbers from the research",
      "sourceUrl": "URL if available"
    }
  ],
  "competitorGaps": ["What existing content about this topic misses"],
  "llmCitabilityTips": ["Specific advice for making this content citable by AI"]
}

CRITICAL RULES:
- Every data claim MUST reference a real source URL from the knowledge graph data
- Include at least 6-8 data claims across the outline sections
- FAQ answers must include specific numbers/data, not generic advice
- Title must include the location name
- Outline should have 4-6 H2 sections
- FAQ should have 3-5 questions
- Competitor gaps should identify 2-3 things existing content misses
- LLM citability tips should be specific and actionable

Respond with ONLY valid JSON, no markdown code fences.`;

  const result = await gemini.generateContent(prompt);
  const text = result.response.text();

  // Parse the JSON response - handle potential markdown fences
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const generated = JSON.parse(cleaned);

  // Collect all data claims from outline sections
  const allDataClaims: DataClaim[] = [];
  for (const section of generated.outline || []) {
    for (const claim of section.dataClaims || []) {
      allDataClaims.push(claim);
    }
  }

  // Build sources list from data claims
  const sourceMap = new Map<string, { url: string; title: string; domain: string; claims: string[] }>();
  for (const claim of allDataClaims) {
    if (claim.sourceUrl) {
      const existing = sourceMap.get(claim.sourceUrl);
      if (existing) {
        existing.claims.push(claim.claim);
      } else {
        let domain = "";
        try {
          domain = new URL(claim.sourceUrl).hostname.replace("www.", "");
        } catch {
          domain = claim.sourceUrl;
        }
        sourceMap.set(claim.sourceUrl, {
          url: claim.sourceUrl,
          title: claim.sourceTitle || domain,
          domain,
          claims: [claim.claim],
        });
      }
    }
  }

  const sources = Array.from(sourceMap.values()).map((s) => ({
    url: s.url,
    title: s.title,
    domain: s.domain,
    usedForClaims: s.claims,
    credibilityNote: getCredibilityNote(s.domain),
  }));

  const id = generateId();

  // Build the brief
  const brief: ContentBrief = {
    id,
    metadata: {
      location,
      topic,
      contentType,
      generatedAt: new Date().toISOString(),
      dataFreshness: `Data current as of ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
      sourcesCount: sources.length,
      signalsCount: allDataClaims.length,
    },
    geoScore: { overall: 0, breakdown: { dataBackedClaims: 0, structuredData: 0, contentStructure: 0, freshness: 0, originalInsights: 0, sourceAuthority: 0 } },
    title: generated.title || `${topic} in ${location}`,
    metaDescription: generated.metaDescription || "",
    targetKeywords: generated.targetKeywords || [],
    outline: generated.outline || [],
    dataClaims: allDataClaims,
    faqSection: generated.faqSection || [],
    jsonLd: {
      article: {},
      faqPage: {},
      breadcrumbList: {},
    },
    sources,
    competitorGaps: generated.competitorGaps || [],
    llmCitabilityTips: generated.llmCitabilityTips || [],
  };

  // Generate JSON-LD
  brief.jsonLd = {
    article: generateArticleSchema(brief),
    faqPage: generateFaqSchema(brief),
    breadcrumbList: generateBreadcrumbSchema(brief),
  };

  // Compute GEO score
  brief.geoScore = computeGeoScore(brief);

  // Store in Neo4j
  try {
    await storeContentBrief({
      id,
      title: brief.title,
      topic,
      geoScore: brief.geoScore.overall,
      location,
    });
  } catch (e) {
    console.error("Failed to store brief in Neo4j:", e);
  }

  return brief;
}

function getCredibilityNote(domain: string): string {
  const notes: Record<string, string> = {
    "census.gov": "Official U.S. Census Bureau data",
    "bls.gov": "Bureau of Labor Statistics",
    "hud.gov": "U.S. Department of Housing",
    "nar.realtor": "National Association of Realtors",
    "zillow.com": "Major real estate marketplace",
    "redfin.com": "Major real estate brokerage",
    "realtor.com": "Official realtor marketplace",
    "freddiemac.com": "Federal mortgage corporation",
    "housingwire.com": "Real estate industry news",
    "inman.com": "Real estate industry news",
    "greatschools.org": "School ratings nonprofit",
    "niche.com": "Neighborhood and school rankings",
    "walkscore.com": "Walkability metrics",
  };
  return notes[domain] || "Third-party source";
}
