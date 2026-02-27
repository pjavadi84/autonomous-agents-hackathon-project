import { NextRequest } from "next/server";
import { runAgent } from "@/lib/agent";
import type { AgentEvent, ContentType } from "@/lib/agent/types";

export const maxDuration = 120; // Allow up to 2 min for agent run

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { location, topic, contentType } = body as {
    location: string;
    topic: string;
    contentType: ContentType;
  };

  if (!location || !topic || !contentType) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: location, topic, contentType" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const onEvent = (event: AgentEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // Stream may be closed
        }
      };

      try {
        await runAgent({ location, topic, contentType, onEvent });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Agent failed";
        onEvent({ type: "error", message });
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
