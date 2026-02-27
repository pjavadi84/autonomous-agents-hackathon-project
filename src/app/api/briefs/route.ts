import { NextRequest } from "next/server";
import { listBriefs, getBrief } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const brief = getBrief(id);
    if (!brief) {
      return Response.json({ error: "Brief not found" }, { status: 404 });
    }
    return Response.json(brief);
  }

  return Response.json(listBriefs());
}
