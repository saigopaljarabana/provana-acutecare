"use client";

// CopilotKit integration point — maps useCopilotAction args to the runtime layer.
// Do not put clinical logic here; it lives in src/components/ProtocolRenderer.tsx.
import type { ProtocolArgs } from "@/lib/protocols";
import { ProtocolRenderer as RuntimeRenderer } from "@/src/components/ProtocolRenderer";

interface Props {
  args: Partial<ProtocolArgs>;
  status: string;
}

export function ProtocolRenderer({ args, status }: Props) {
  return <RuntimeRenderer {...args} status={status} />;
}
