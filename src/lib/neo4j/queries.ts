import { getNeo4jDriver } from "./client";

function getDriver() {
  return getNeo4jDriver();
}

export async function upsertLocationAndNeighborhood(
  location: string,
  neighborhood: string,
  data?: {
    medianPrice?: number;
    avgDaysOnMarket?: number;
    priceChangeYoY?: number;
    walkScore?: number;
  }
) {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MERGE (l:Location {name: $location})
      ON CREATE SET l.id = randomUUID(), l.createdAt = datetime()
      MERGE (n:Neighborhood {name: $neighborhood})
      ON CREATE SET n.id = randomUUID()
      MERGE (n)-[:HAS_NEIGHBORHOOD]->(l)
      SET n.updatedAt = datetime()
      ${data?.medianPrice != null ? ", n.medianPrice = $medianPrice" : ""}
      ${data?.avgDaysOnMarket != null ? ", n.avgDaysOnMarket = $avgDaysOnMarket" : ""}
      ${data?.priceChangeYoY != null ? ", n.priceChangeYoY = $priceChangeYoY" : ""}
      ${data?.walkScore != null ? ", n.walkScore = $walkScore" : ""}
      RETURN n, l
      `,
      { location, neighborhood, ...data }
    );
    return result.records.length;
  } finally {
    await session.close();
  }
}

export async function createMarketSignal(params: {
  location: string;
  neighborhood?: string;
  signalType: string;
  headline: string;
  summary: string;
  value?: string;
  sentiment: string;
  sourceUrl: string;
  sourceTitle: string;
}) {
  const driver = getDriver();
  const session = driver.session();
  try {
    const domain = new URL(params.sourceUrl).hostname.replace("www.", "");
    const result = await session.run(
      `
      MERGE (l:Location {name: $location})
      ON CREATE SET l.id = randomUUID(), l.createdAt = datetime()
      ${
        params.neighborhood
          ? `
      MERGE (n:Neighborhood {name: $neighborhood})
      ON CREATE SET n.id = randomUUID()
      MERGE (n)-[:HAS_NEIGHBORHOOD]->(l)
      `
          : ""
      }
      MERGE (s:Source {url: $sourceUrl})
      ON CREATE SET s.id = randomUUID(), s.title = $sourceTitle,
                    s.domain = $domain, s.createdAt = datetime()
      CREATE (ms:MarketSignal {
        id: randomUUID(),
        type: $signalType,
        headline: $headline,
        summary: $summary,
        value: $value,
        sentiment: $sentiment,
        date: date(),
        createdAt: datetime()
      })
      ${
        params.neighborhood
          ? "CREATE (n)-[:HAS_SIGNAL]->(ms)"
          : "CREATE (l)<-[:AFFECTS]-(ms)"
      }
      CREATE (ms)-[:SOURCED_FROM]->(s)
      RETURN ms
      `,
      { ...params, domain }
    );
    return result.records.length;
  } finally {
    await session.close();
  }
}

export async function createAmenity(params: {
  neighborhood: string;
  location: string;
  amenityName: string;
  amenityType: string;
  rating?: number;
}) {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MERGE (l:Location {name: $location})
      ON CREATE SET l.id = randomUUID(), l.createdAt = datetime()
      MERGE (n:Neighborhood {name: $neighborhood})
      ON CREATE SET n.id = randomUUID()
      MERGE (n)-[:HAS_NEIGHBORHOOD]->(l)
      MERGE (a:Amenity {name: $amenityName, type: $amenityType})
      ON CREATE SET a.id = randomUUID()
      ${params.rating != null ? "SET a.rating = $rating" : ""}
      MERGE (n)-[:HAS_AMENITY]->(a)
      RETURN a
      `,
      params
    );
    return result.records.length;
  } finally {
    await session.close();
  }
}

export async function getFullContext(location: string) {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (l:Location {name: $location})<-[:HAS_NEIGHBORHOOD]-(n:Neighborhood)
      OPTIONAL MATCH (n)-[:HAS_SIGNAL]->(ms:MarketSignal)
      OPTIONAL MATCH (ms)-[:SOURCED_FROM]->(s:Source)
      OPTIONAL MATCH (n)-[:HAS_AMENITY]->(a:Amenity)
      RETURN n.name AS neighborhood,
             n.medianPrice AS medianPrice,
             n.avgDaysOnMarket AS avgDaysOnMarket,
             n.priceChangeYoY AS priceChangeYoY,
             collect(DISTINCT {
               type: ms.type, headline: ms.headline, summary: ms.summary,
               value: ms.value, sentiment: ms.sentiment, date: toString(ms.date),
               sourceUrl: s.url, sourceTitle: s.title
             }) AS signals,
             collect(DISTINCT {name: a.name, type: a.type, rating: a.rating}) AS amenities
      ORDER BY n.medianPrice DESC
      `,
      { location }
    );
    return result.records.map((r) => ({
      neighborhood: r.get("neighborhood"),
      medianPrice: r.get("medianPrice"),
      avgDaysOnMarket: r.get("avgDaysOnMarket"),
      priceChangeYoY: r.get("priceChangeYoY"),
      signals: r.get("signals").filter((s: Record<string, unknown>) => s.headline != null),
      amenities: r.get("amenities").filter((a: Record<string, unknown>) => a.name != null),
    }));
  } finally {
    await session.close();
  }
}

export async function getMarketSignals(location: string) {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (l:Location {name: $location})<-[:HAS_NEIGHBORHOOD]-(n:Neighborhood)-[:HAS_SIGNAL]->(ms:MarketSignal)
      OPTIONAL MATCH (ms)-[:SOURCED_FROM]->(s:Source)
      RETURN ms.headline AS headline, ms.summary AS summary, ms.type AS type,
             ms.value AS value, ms.sentiment AS sentiment,
             toString(ms.date) AS date, s.url AS sourceUrl, s.title AS sourceTitle,
             n.name AS neighborhood
      ORDER BY ms.createdAt DESC
      `,
      { location }
    );
    return result.records.map((r) => ({
      headline: r.get("headline"),
      summary: r.get("summary"),
      type: r.get("type"),
      value: r.get("value"),
      sentiment: r.get("sentiment"),
      date: r.get("date"),
      sourceUrl: r.get("sourceUrl"),
      sourceTitle: r.get("sourceTitle"),
      neighborhood: r.get("neighborhood"),
    }));
  } finally {
    await session.close();
  }
}

export async function getTopSourceDomains() {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (s:Source)<-[:SOURCED_FROM]-(ms:MarketSignal)
      RETURN s.domain AS domain, count(ms) AS signalCount
      ORDER BY signalCount DESC LIMIT 10
    `);
    return result.records.map((r) => ({
      domain: r.get("domain"),
      signalCount:
        typeof r.get("signalCount") === "object"
          ? r.get("signalCount").toNumber()
          : r.get("signalCount"),
    }));
  } finally {
    await session.close();
  }
}

export async function getAverageGeoScore() {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (cb:ContentBrief)
      WHERE cb.geoScore IS NOT NULL
      RETURN avg(cb.geoScore) AS avgScore, count(cb) AS briefCount
    `);
    if (result.records.length === 0) return null;
    const avgScore = result.records[0].get("avgScore");
    const briefCount = result.records[0].get("briefCount");
    return {
      avgScore: avgScore ? Math.round(avgScore) : null,
      briefCount:
        typeof briefCount === "object" ? briefCount.toNumber() : briefCount,
    };
  } finally {
    await session.close();
  }
}

export async function storeContentBrief(params: {
  id: string;
  title: string;
  topic: string;
  geoScore: number;
  location: string;
}) {
  const driver = getDriver();
  const session = driver.session();
  try {
    await session.run(
      `
      MERGE (l:Location {name: $location})
      ON CREATE SET l.id = randomUUID(), l.createdAt = datetime()
      CREATE (cb:ContentBrief {
        id: $id,
        title: $title,
        topic: $topic,
        geoScore: $geoScore,
        status: 'final',
        createdAt: datetime()
      })
      CREATE (cb)-[:GENERATED_FOR]->(l)
      RETURN cb
      `,
      params
    );
  } finally {
    await session.close();
  }
}

export async function getGraphVisualizationData() {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (n)
      WHERE n:Location OR n:Neighborhood OR n:MarketSignal OR n:Source OR n:Amenity OR n:ContentBrief
      OPTIONAL MATCH (n)-[r]->(m)
      WITH collect(DISTINCT {
        id: elementId(n),
        label: labels(n)[0],
        name: COALESCE(n.name, n.headline, n.title, n.id)
      }) AS fromNodes,
      collect(DISTINCT {
        id: elementId(m),
        label: labels(m)[0],
        name: COALESCE(m.name, m.headline, m.title, m.id)
      }) AS toNodes,
      collect({source: elementId(n), target: elementId(m), type: type(r)}) AS rels
      RETURN fromNodes + toNodes AS nodes, rels AS edges
    `);
    if (result.records.length === 0) return { nodes: [], edges: [] };
    const rawNodes = result.records[0].get("nodes") as Array<Record<string, string>>;
    const rawEdges = result.records[0].get("edges") as Array<Record<string, string>>;

    // Deduplicate nodes by id
    const nodeMap = new Map<string, Record<string, string>>();
    for (const n of rawNodes) {
      if (n.id && n.label) nodeMap.set(n.id, n);
    }

    return {
      nodes: Array.from(nodeMap.values()),
      edges: rawEdges.filter((e) => e.source && e.target && e.type),
    };
  } finally {
    await session.close();
  }
}
