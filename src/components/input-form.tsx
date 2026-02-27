"use client";

import { useState } from "react";

interface InputFormProps {
  onSubmit: (data: { location: string; topic: string; contentType: string }) => void;
  isRunning: boolean;
}

const CONTENT_TYPES = [
  { value: "market_report", label: "Market Report" },
  { value: "neighborhood_guide", label: "Neighborhood Guide" },
  { value: "buyer_guide", label: "Buyer Guide" },
  { value: "investment_analysis", label: "Investment Analysis" },
];

export default function InputForm({ onSubmit, isRunning }: InputFormProps) {
  const [location, setLocation] = useState("");
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState("market_report");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;
    const defaultTopic = topic.trim() || `${CONTENT_TYPES.find(c => c.value === contentType)?.label} for ${location}`;
    onSubmit({ location: location.trim(), topic: defaultTopic, contentType });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-neutral-300 mb-1">
          Location
        </label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. San Francisco, CA"
          className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isRunning}
        />
      </div>
      <div>
        <label htmlFor="topic" className="block text-sm font-medium text-neutral-300 mb-1">
          Topic (optional)
        </label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Auto-generated from content type + location"
          className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isRunning}
        />
      </div>
      <div>
        <label htmlFor="contentType" className="block text-sm font-medium text-neutral-300 mb-1">
          Content Type
        </label>
        <select
          id="contentType"
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
          className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isRunning}
        >
          {CONTENT_TYPES.map((ct) => (
            <option key={ct.value} value={ct.value}>
              {ct.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={isRunning || !location.trim()}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-semibold rounded-lg transition-colors"
      >
        {isRunning ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Agent Running...
          </span>
        ) : (
          "Generate Brief"
        )}
      </button>
    </form>
  );
}
