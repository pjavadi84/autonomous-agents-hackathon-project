import tavilyClient from "./client";

const REAL_ESTATE_DOMAINS = [
  "zillow.com",
  "realtor.com",
  "redfin.com",
  "nar.realtor",
  "housingwire.com",
  "inman.com",
  "census.gov",
  "freddiemac.com",
  "niche.com",
  "walkscore.com",
  "greatschools.org",
];

export async function searchMarketData(
  query: string,
  location: string,
  timeRange?: "week" | "month" | "year"
) {
  const fullQuery = `${query} ${location} real estate market data ${new Date().getFullYear()}`;
  const response = await tavilyClient.search(fullQuery, {
    topic: "news",
    searchDepth: "advanced",
    maxResults: 8,
    includeAnswer: "advanced" as unknown as boolean,
    includeDomains: REAL_ESTATE_DOMAINS,
    ...(timeRange === "week" ? { days: 7 } : {}),
    ...(timeRange === "month" ? { days: 30 } : {}),
  });

  return {
    answer: response.answer || null,
    results: response.results.map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    })),
  };
}

export async function searchNeighborhoodInfo(
  neighborhood: string,
  location: string,
  aspects?: string[]
) {
  const aspectStr = aspects?.length
    ? aspects.join(", ")
    : "schools, parks, transit, restaurants, walkability";
  const fullQuery = `${neighborhood} ${location} neighborhood guide ${aspectStr}`;
  const response = await tavilyClient.search(fullQuery, {
    topic: "general",
    searchDepth: "advanced",
    maxResults: 8,
    includeAnswer: "advanced" as unknown as boolean,
  });

  return {
    answer: response.answer || null,
    results: response.results.map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    })),
  };
}
