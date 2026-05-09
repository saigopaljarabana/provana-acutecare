"use client";

import { useEventStore, type ControlEvent } from "@/lib/eventStore";

const CATEGORY_COLORS: Record<string, string> = {
  controller: "bg-emerald-500",
  plant: "bg-blue-500",
  sensor: "bg-amber-500",
  block: "bg-red-500",
  feedback: "bg-gray-500",
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-gray-200 text-gray-700",
  PASS: "bg-emerald-100 text-emerald-800",
  FAIL: "bg-red-100 text-red-800",
  BLOCKED: "bg-red-200 text-red-900",
  ALERT: "bg-amber-200 text-amber-900",
  ROUTED: "bg-purple-200 text-purple-900",
  CHAINED: "bg-emerald-200 text-emerald-900",
};

function EventRow({ event }: { event: ControlEvent }) {
  const dotColor = CATEGORY_COLORS[event.category] ?? "bg-gray-400";
  const isPending = event.status === "PENDING";
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-b-0">
      <span
        className={`mt-1.5 inline-block w-2 h-2 rounded-full shrink-0 ${dotColor} ${
          isPending ? "animate-pulse" : ""
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">{event.label}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {event.value !== undefined && (
              <span className="text-xs font-mono text-gray-600">
                {event.value.toFixed(2)}
                {event.threshold !== undefined && (
                  <span className="text-gray-400"> / {event.threshold.toFixed(2)}</span>
                )}
              </span>
            )}
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                STATUS_BADGE[event.status] ?? "bg-gray-100 text-gray-700"
              }`}
            >
              {event.status}
            </span>
            {event.duration_ms !== undefined && (
              <span className="text-[10px] font-mono text-gray-400">{event.duration_ms}ms</span>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 truncate">{event.detail}</p>
      </div>
    </div>
  );
}

export function ControlFeedback() {
  const events = useEventStore((s) => s.events);
  const clear = useEventStore((s) => s.clear);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 shrink-0">
        <h2 className="text-sm font-bold text-blue-700 tracking-wide">CONTROL FEEDBACK</h2>
        <button
          onClick={clear}
          className="text-xs text-gray-500 hover:text-gray-900 font-medium"
        >
          Clear
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {events.length === 0 ? (
          <p className="text-xs text-gray-400 text-center mt-8">
            No governance events yet.
            <br />
            Trigger a protocol or governed action to see the cascade.
          </p>
        ) : (
          events.map((event) => <EventRow key={event.id} event={event} />)
        )}
      </div>
    </div>
  );
}
