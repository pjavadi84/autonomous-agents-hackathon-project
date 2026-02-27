import { getGraphVisualizationData } from "@/lib/neo4j/queries";

export async function GET() {
  try {
    const data = await getGraphVisualizationData();
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch graph data";
    return Response.json({ error: message, nodes: [], edges: [] }, { status: 500 });
  }
}
