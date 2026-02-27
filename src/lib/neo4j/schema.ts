// Node labels
export const Labels = {
  LOCATION: "Location",
  NEIGHBORHOOD: "Neighborhood",
  MARKET_SIGNAL: "MarketSignal",
  SOURCE: "Source",
  AMENITY: "Amenity",
  CONTENT_BRIEF: "ContentBrief",
} as const;

// Relationship types
export const Relationships = {
  HAS_NEIGHBORHOOD: "HAS_NEIGHBORHOOD",
  HAS_SIGNAL: "HAS_SIGNAL",
  SOURCED_FROM: "SOURCED_FROM",
  HAS_AMENITY: "HAS_AMENITY",
  GENERATED_FOR: "GENERATED_FOR",
  CITES: "CITES",
  INFORMED_BY: "INFORMED_BY",
} as const;

// Market signal types
export const SignalTypes = [
  "price_trend",
  "inventory",
  "demand",
  "regulation",
  "development",
] as const;

export type SignalType = (typeof SignalTypes)[number];

// Amenity types
export const AmenityTypes = [
  "school",
  "park",
  "transit",
  "shopping",
  "hospital",
  "restaurant",
] as const;

export type AmenityType = (typeof AmenityTypes)[number];
