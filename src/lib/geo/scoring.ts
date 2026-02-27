import { ContentBrief, GeoScore } from "../agent/types";

const AUTHORITY_DOMAINS: Record<string, number> = {
  // Government
  "census.gov": 3, "bls.gov": 3, "hud.gov": 3, "freddiemac.com": 3, "fanniemae.com": 3,
  // Major industry
  "nar.realtor": 2, "zillow.com": 2, "redfin.com": 2, "realtor.com": 2,
  // News
  "housingwire.com": 2, "inman.com": 2, "wsj.com": 2, "nytimes.com": 2, "reuters.com": 2,
  // Education / community
  "greatschools.org": 2, "niche.com": 2, "walkscore.com": 2,
};

function scoreDataBackedClaims(brief: ContentBrief): number {
  // 2 points per unique cited claim, max 20
  return Math.min(20, brief.dataClaims.length * 2);
}

function scoreStructuredData(brief: ContentBrief): number {
  // 5 points per JSON-LD schema present
  let score = 0;
  if (brief.jsonLd.article && Object.keys(brief.jsonLd.article).length > 0) score += 5;
  if (brief.jsonLd.faqPage && Object.keys(brief.jsonLd.faqPage).length > 0) score += 5;
  if (brief.jsonLd.breadcrumbList && Object.keys(brief.jsonLd.breadcrumbList).length > 0) score += 5;
  // Bonus 5 for having all three
  if (score === 15) score += 5;
  return Math.min(20, score);
}

function scoreContentStructure(brief: ContentBrief): number {
  let score = 0;
  // FAQ section with 3+ questions
  if (brief.faqSection.length >= 3) score += 4;
  else if (brief.faqSection.length >= 1) score += 2;
  // 3+ H2 sections in outline
  if (brief.outline.length >= 3) score += 4;
  else if (brief.outline.length >= 1) score += 2;
  // H3 sub-sections present
  const hasH3s = brief.outline.some((s) => s.h3s && s.h3s.length > 0);
  if (hasH3s) score += 4;
  // Key data points in sections
  const sectionsWithData = brief.outline.filter((s) => s.dataClaims.length > 0);
  if (sectionsWithData.length >= 2) score += 4;
  else if (sectionsWithData.length >= 1) score += 2;
  // Meta description length 120-160
  const metaLen = brief.metaDescription.length;
  if (metaLen >= 120 && metaLen <= 160) score += 4;
  else if (metaLen >= 80 && metaLen <= 200) score += 2;
  return Math.min(20, score);
}

function scoreFreshness(brief: ContentBrief): number {
  const now = new Date();
  const claimDates = brief.dataClaims
    .map((c) => {
      // Try to extract year from the claim text
      const yearMatch = c.claim.match(/20\d{2}/);
      if (yearMatch) return new Date(yearMatch[0]);
      return null;
    })
    .filter((d): d is Date => d !== null);

  if (claimDates.length === 0) {
    // If claims reference "current" data, give moderate score
    const hasCurrentRefs = brief.dataClaims.some(
      (c) =>
        c.claim.toLowerCase().includes("2026") ||
        c.claim.toLowerCase().includes("current") ||
        c.claim.toLowerCase().includes("february")
    );
    return hasCurrentRefs ? 10 : 3;
  }

  const mostRecent = new Date(Math.max(...claimDates.map((d) => d.getTime())));
  const daysDiff = (now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24);

  if (daysDiff <= 7) return 15;
  if (daysDiff <= 30) return 10;
  if (daysDiff <= 90) return 5;
  return 0;
}

function scoreOriginalInsights(brief: ContentBrief): number {
  let score = 0;
  // Has competitor gap analysis
  if (brief.competitorGaps.length > 0) score += 5;
  // Has cross-referenced data (multiple sources for overlapping claims)
  const sourceUrls = brief.dataClaims.map((c) => c.sourceUrl);
  const uniqueSources = new Set(sourceUrls);
  if (uniqueSources.size >= 3) score += 5;
  else if (uniqueSources.size >= 2) score += 3;
  // Has neighborhood comparison
  const neighborhoods = brief.outline.filter(
    (s) =>
      s.h2.toLowerCase().includes("neighborhood") ||
      s.h2.toLowerCase().includes("area") ||
      s.h2.toLowerCase().includes("comparison")
  );
  if (neighborhoods.length > 0) score += 5;
  return Math.min(15, score);
}

function scoreSourceAuthority(brief: ContentBrief): number {
  if (brief.sources.length === 0) return 0;
  const weights = brief.sources.map((s) => {
    const domain = s.domain.replace("www.", "");
    return AUTHORITY_DOMAINS[domain] || 1;
  });
  const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
  // Scale: avg of 3 = 10 points, avg of 1 = 3 points
  return Math.min(10, Math.round((avg / 3) * 10));
}

export function computeGeoScore(brief: ContentBrief): GeoScore {
  const breakdown = {
    dataBackedClaims: scoreDataBackedClaims(brief),
    structuredData: scoreStructuredData(brief),
    contentStructure: scoreContentStructure(brief),
    freshness: scoreFreshness(brief),
    originalInsights: scoreOriginalInsights(brief),
    sourceAuthority: scoreSourceAuthority(brief),
  };

  return {
    overall: Object.values(breakdown).reduce((a, b) => a + b, 0),
    breakdown,
  };
}

export function getWeakestDimension(score: GeoScore): string {
  const maxScores: Record<string, number> = {
    dataBackedClaims: 20,
    structuredData: 20,
    contentStructure: 20,
    freshness: 15,
    originalInsights: 15,
    sourceAuthority: 10,
  };

  let weakest = "";
  let lowestPct = 1;
  for (const [key, value] of Object.entries(score.breakdown)) {
    const pct = value / maxScores[key];
    if (pct < lowestPct) {
      lowestPct = pct;
      weakest = key;
    }
  }
  return weakest;
}
