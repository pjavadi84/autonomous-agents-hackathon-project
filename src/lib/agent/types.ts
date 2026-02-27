export interface DataClaim {
  claim: string;
  value: string;
  sourceUrl: string;
  sourceTitle: string;
  confidence: "high" | "medium";
}

export interface GeoScoreBreakdown {
  dataBackedClaims: number;
  structuredData: number;
  contentStructure: number;
  freshness: number;
  originalInsights: number;
  sourceAuthority: number;
}

export interface GeoScore {
  overall: number;
  breakdown: GeoScoreBreakdown;
}

export interface ContentBrief {
  id: string;
  metadata: {
    location: string;
    topic: string;
    contentType: ContentType;
    generatedAt: string;
    dataFreshness: string;
    sourcesCount: number;
    signalsCount: number;
  };
  geoScore: GeoScore;
  title: string;
  metaDescription: string;
  targetKeywords: string[];
  outline: Array<{
    h2: string;
    h3s?: string[];
    keyPoints: string[];
    dataClaims: DataClaim[];
  }>;
  dataClaims: DataClaim[];
  faqSection: Array<{
    question: string;
    answer: string;
    sourceUrl?: string;
  }>;
  jsonLd: {
    article: Record<string, unknown>;
    faqPage: Record<string, unknown>;
    breadcrumbList: Record<string, unknown>;
  };
  sources: Array<{
    url: string;
    title: string;
    domain: string;
    usedForClaims: string[];
    credibilityNote: string;
  }>;
  competitorGaps: string[];
  llmCitabilityTips: string[];
}

export type ContentType =
  | "neighborhood_guide"
  | "market_report"
  | "buyer_guide"
  | "investment_analysis";

export type AgentPhase = "research" | "connect" | "generate";

export type AgentEvent =
  | { type: "phase"; phase: AgentPhase }
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; summary: string }
  | { type: "thinking"; content: string }
  | { type: "graph_update"; nodesAdded: number; edgesAdded: number }
  | { type: "complete"; brief: ContentBrief }
  | { type: "error"; message: string };

export interface AgentConfig {
  location: string;
  topic: string;
  contentType: ContentType;
  onEvent: (event: AgentEvent) => void;
}
