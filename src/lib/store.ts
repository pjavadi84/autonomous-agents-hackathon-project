import { ContentBrief } from "./agent/types";

// In-memory store for briefs (sufficient for hackathon demo)
const briefs = new Map<string, ContentBrief>();

export function addBrief(brief: ContentBrief): void {
  briefs.set(brief.id, brief);
}

export function getBrief(id: string): ContentBrief | undefined {
  return briefs.get(id);
}

export function listBriefs(): ContentBrief[] {
  return Array.from(briefs.values()).sort(
    (a, b) =>
      new Date(b.metadata.generatedAt).getTime() -
      new Date(a.metadata.generatedAt).getTime()
  );
}
