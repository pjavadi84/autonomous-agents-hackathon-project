import tavilyClient from "./client";

export async function extractPageContent(urls: string[]) {
  const response = await tavilyClient.extract(urls, {
    extractDepth: "advanced",
  });

  return response.results.map((r) => ({
    url: r.url,
    content: r.rawContent,
  }));
}
