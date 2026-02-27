import { ContentBrief } from "../agent/types";

export function generateArticleSchema(brief: ContentBrief): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: brief.title,
    description: brief.metaDescription,
    keywords: brief.targetKeywords.join(", "),
    datePublished: brief.metadata.generatedAt,
    dateModified: brief.metadata.generatedAt,
    author: {
      "@type": "Organization",
      name: "GeoAgent Market Intelligence",
    },
    publisher: {
      "@type": "Organization",
      name: "GeoAgent",
    },
    about: {
      "@type": "Place",
      name: brief.metadata.location,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
    },
    articleSection: brief.outline.map((s) => s.h2),
    wordCount: brief.outline.reduce(
      (acc, s) => acc + s.keyPoints.join(" ").split(" ").length * 3,
      0
    ),
  };
}

export function generateFaqSchema(brief: ContentBrief): Record<string, unknown> {
  if (brief.faqSection.length === 0) return {};
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: brief.faqSection.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateBreadcrumbSchema(brief: ContentBrief): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: brief.metadata.location,
        item: `/${brief.metadata.location.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: brief.title,
      },
    ],
  };
}
