import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { searchMarketData, searchNeighborhoodInfo } from "../tavily/search";
import { extractPageContent } from "../tavily/extract";
import {
  createMarketSignal,
  createAmenity,
  getFullContext,
  getMarketSignals,
} from "../neo4j/queries";
import { generateContentBrief } from "../geo/brief";
import { addBrief } from "../store";
import type { ContentType } from "./types";

export const toolDefinitions: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_market_data",
      description:
        "Search for current real estate market data, listings, and trends for a specific location. Use this to find median prices, inventory levels, days on market, and market conditions.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query focused on real estate market data",
          },
          location: {
            type: "string",
            description: "City or neighborhood name",
          },
          timeRange: {
            type: "string",
            enum: ["week", "month", "year"],
            description: "How recent the data should be",
          },
        },
        required: ["query", "location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_neighborhood_info",
      description:
        "Search for neighborhood details including schools, amenities, walkability, lifestyle, and community features.",
      parameters: {
        type: "object",
        properties: {
          neighborhood: { type: "string" },
          location: { type: "string" },
          aspects: {
            type: "array",
            items: { type: "string" },
            description:
              "e.g. ['schools', 'parks', 'transit', 'restaurants']",
          },
        },
        required: ["neighborhood", "location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "extract_page_content",
      description:
        "Extract and parse the full content from a specific URL. Use when you found a promising source and need detailed data from it.",
      parameters: {
        type: "object",
        properties: {
          urls: {
            type: "array",
            items: { type: "string" },
            description: "URLs to extract content from (max 5)",
          },
        },
        required: ["urls"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "store_market_signal",
      description:
        "Store a discovered market data point in the knowledge graph. Call this every time you find a specific, citable fact or statistic.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string" },
          neighborhood: { type: "string" },
          signalType: {
            type: "string",
            enum: [
              "price_trend",
              "inventory",
              "demand",
              "regulation",
              "development",
            ],
          },
          headline: {
            type: "string",
            description: "Short factual headline",
          },
          summary: {
            type: "string",
            description: "2-3 sentence summary with specific numbers",
          },
          value: {
            type: "string",
            description: "Key metric value, e.g. '$1.2M median'",
          },
          sentiment: {
            type: "string",
            enum: ["positive", "negative", "neutral"],
          },
          sourceUrl: { type: "string" },
          sourceTitle: { type: "string" },
        },
        required: [
          "location",
          "signalType",
          "headline",
          "summary",
          "sentiment",
          "sourceUrl",
          "sourceTitle",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "store_amenity",
      description:
        "Store a neighborhood amenity (school, park, transit stop, etc.) in the knowledge graph.",
      parameters: {
        type: "object",
        properties: {
          neighborhood: { type: "string" },
          location: { type: "string" },
          amenityName: { type: "string" },
          amenityType: {
            type: "string",
            enum: [
              "school",
              "park",
              "transit",
              "shopping",
              "hospital",
              "restaurant",
            ],
          },
          rating: {
            type: "number",
            description: "Rating if available (1-10 scale)",
          },
        },
        required: ["neighborhood", "location", "amenityName", "amenityType"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_knowledge_graph",
      description:
        "Query the knowledge graph to retrieve previously stored data about a location. Use this before generating content to gather all available intelligence.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string" },
          queryType: {
            type: "string",
            enum: ["full_context", "market_signals"],
          },
        },
        required: ["location", "queryType"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_content_brief",
      description:
        "Generate the final GEO-optimized content brief. Only call this after you have completed research and stored sufficient data in the knowledge graph.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string" },
          topic: {
            type: "string",
            description: "Primary topic for the content brief",
          },
          targetKeywords: {
            type: "array",
            items: { type: "string" },
          },
          contentType: {
            type: "string",
            enum: [
              "neighborhood_guide",
              "market_report",
              "buyer_guide",
              "investment_analysis",
            ],
          },
        },
        required: ["location", "topic", "contentType"],
      },
    },
  },
];

export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ result: unknown; nodesAdded?: number }> {
  switch (name) {
    case "search_market_data": {
      const data = await searchMarketData(
        args.query as string,
        args.location as string,
        args.timeRange as "week" | "month" | "year" | undefined
      );
      return { result: data };
    }

    case "search_neighborhood_info": {
      const data = await searchNeighborhoodInfo(
        args.neighborhood as string,
        args.location as string,
        args.aspects as string[] | undefined
      );
      return { result: data };
    }

    case "extract_page_content": {
      const urls = (args.urls as string[]).slice(0, 5);
      const data = await extractPageContent(urls);
      return { result: data };
    }

    case "store_market_signal": {
      const count = await createMarketSignal({
        location: args.location as string,
        neighborhood: args.neighborhood as string | undefined,
        signalType: args.signalType as string,
        headline: args.headline as string,
        summary: args.summary as string,
        value: args.value as string | undefined,
        sentiment: args.sentiment as string,
        sourceUrl: args.sourceUrl as string,
        sourceTitle: args.sourceTitle as string,
      });
      return { result: { stored: true, headline: args.headline }, nodesAdded: count };
    }

    case "store_amenity": {
      const count = await createAmenity({
        neighborhood: args.neighborhood as string,
        location: args.location as string,
        amenityName: args.amenityName as string,
        amenityType: args.amenityType as string,
        rating: args.rating as number | undefined,
      });
      return { result: { stored: true, name: args.amenityName }, nodesAdded: count };
    }

    case "query_knowledge_graph": {
      const location = args.location as string;
      const queryType = args.queryType as string;
      if (queryType === "market_signals") {
        const data = await getMarketSignals(location);
        return { result: data };
      }
      const data = await getFullContext(location);
      return { result: data };
    }

    case "generate_content_brief": {
      const graphContext = await getFullContext(args.location as string);
      const brief = await generateContentBrief({
        location: args.location as string,
        topic: args.topic as string,
        contentType: args.contentType as ContentType,
        targetKeywords: args.targetKeywords as string[] | undefined,
        graphContext,
      });
      addBrief(brief);
      return { result: brief };
    }

    default:
      return { result: { error: `Unknown tool: ${name}` } };
  }
}
