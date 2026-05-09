"use client";

import type { ProtocolArgs } from "@/lib/protocols";
import type { GovernedAction } from "@/lib/types";
import { ProtocolRenderer as RuntimeRenderer, type GovernanceResult } from "@/src/components/ProtocolRenderer";

interface Props {
  args: Partial<ProtocolArgs>;
  status: string;
  onAction?: (action: GovernedAction) => GovernanceResult;
}

export function ProtocolRenderer({ args, status, onAction }: Props) {
  return <RuntimeRenderer {...args} status={status} onAction={onAction} />;
}
