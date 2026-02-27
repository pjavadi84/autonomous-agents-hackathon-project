"use client";

type Phase = "research" | "connect" | "generate" | null;

const STEPS = [
  { key: "research", label: "Research", color: "bg-blue-500" },
  { key: "connect", label: "Connect", color: "bg-green-500" },
  { key: "generate", label: "Generate", color: "bg-purple-500" },
] as const;

export default function StepIndicator({ currentPhase }: { currentPhase: Phase }) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentPhase);

  return (
    <div className="flex items-center gap-2 mb-4">
      {STEPS.map((step, i) => {
        const isActive = step.key === currentPhase;
        const isDone = currentIndex > i;
        return (
          <div key={step.key} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? `${step.color} text-white`
                  : isDone
                    ? "bg-neutral-700 text-neutral-300"
                    : "bg-neutral-800 text-neutral-500"
              }`}
            >
              {isDone && <span>&#10003;</span>}
              {isActive && (
                <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
              )}
              {step.label}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-6 h-0.5 ${isDone || isActive ? "bg-neutral-600" : "bg-neutral-800"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
