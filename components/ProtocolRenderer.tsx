"use client";

import type { ProtocolArgs } from "@/lib/protocols";
import { SepsisCard } from "./SepsisCard";
import { StrokeCard } from "./StrokeCard";
import { PediatricFeverCard } from "./PediatricFeverCard";

interface Props {
  args: Partial<ProtocolArgs>;
  status: string;
}

export function ProtocolRenderer({ args, status }: Props) {
  switch (args.protocolType) {
    case "sepsis":
      return <SepsisCard {...args} status={status} />;
    case "stroke":
      return <StrokeCard {...args} status={status} />;
    case "pediatric_fever":
      return <PediatricFeverCard {...args} status={status} />;
    default:
      return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          Unrecognized protocol:{" "}
          <span className="font-mono font-semibold">{args.protocolType ?? "none"}</span>
        </div>
      );
  }
}
