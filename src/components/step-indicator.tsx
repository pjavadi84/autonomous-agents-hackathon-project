"use client";

type Phase = "research" | "connect" | "generate" | null;

const STEPS = [
  { key: "research", label: "Research", color: "bg-blue-500", ring: "ring-blue-500/30" },
  { key: "connect", label: "Connect", color: "bg-emerald-500", ring: "ring-emerald-500/30" },
  { key: "generate", label: "Generate", color: "bg-purple-500", ring: "ring-purple-500/30" },
] as const;

export default function StepIndicator({ currentPhase }: { currentPhase: Phase }) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentPhase);

  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map((step, i) => {
        const isActive = step.key === currentPhase;
        const isDone = currentIndex > i;
        return (
          <div key={step.key} className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-300 ${
                isActive
                  ? `${step.color} text-white ring-2 ${step.ring}`
                  : isDone
                    ? "bg-neutral-700 text-neutral-300"
                    : "bg-neutral-800/60 text-neutral-600"
              }`}
            >
              {isDone && (
                <span className="text-[10px]">&#10003;</span>
              )}
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-glow" />
              )}
              {step.label}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-px transition-colors duration-300 ${isDone ? "bg-neutral-500" : "bg-neutral-800"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
