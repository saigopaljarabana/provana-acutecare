import { create } from 'zustand';

export type ControlEventCategory = 'controller' | 'plant' | 'sensor' | 'block' | 'feedback';

export type ControlEventStatus =
  | 'PENDING' | 'PASS' | 'FAIL' | 'BLOCKED' | 'ALERT' | 'ROUTED' | 'CHAINED';

export type ControlEventStage =
  | 'rbac' | 'retrieval' | 'acl' | 'evidence' | 'generation'
  | 'hhem' | 'tool_auth' | 'tool_exec' | 'hitl' | 'audit';

export type ControlEvent = {
  id: string;
  timestamp: number;
  category: ControlEventCategory;
  stage: ControlEventStage;
  label: string;
  detail: string;
  status: ControlEventStatus;
  value?: number;
  threshold?: number;
  duration_ms?: number;
  demoMode: true;
};

type EventStore = {
  events: ControlEvent[];
  addEvent: (event: Omit<ControlEvent, 'id' | 'timestamp' | 'demoMode'>) => string;
  updateEvent: (id: string, updates: Partial<Pick<ControlEvent, 'status' | 'value' | 'duration_ms' | 'detail'>>) => void;
  clear: () => void;
};

export const useEventStore = create<EventStore>((set) => ({
  events: [],
  addEvent: (event) => {
    const id = `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({
      events: [...state.events, { ...event, id, timestamp: Date.now(), demoMode: true }],
    }));
    return id;
  },
  updateEvent: (id, updates) => set((state) => ({
    events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
  })),
  clear: () => set({ events: [] }),
}));
