import { ArrowDownIcon, ArrowUpIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

type Props = {
  value: ReactNode;
  label: string;
  trend?: { direction: "up" | "down"; text: string; good?: boolean };
  boxed?: boolean;
  className?: string;
};

export function StatTile({ value, label, trend, boxed = false, className = "" }: Props) {
  const good = trend ? (trend.good ?? trend.direction === "up") : false;

  return (
    <div className={`min-w-0 ${boxed ? "card" : ""} ${className}`}>
      <p className="font-display text-h1 font-extrabold tabular-nums text-fg [overflow-wrap:anywhere]">{value}</p>
      <p className="mt-1 text-small font-bold text-fg-muted">{label}</p>
      {trend ? (
        <p className={`mt-1 inline-flex items-center gap-1 text-label font-extrabold ${good ? "text-correct-text" : "text-wrong-text"}`}>
          {trend.direction === "up" ? <ArrowUpIcon size={14} weight="bold" aria-hidden="true" /> : <ArrowDownIcon size={14} weight="bold" aria-hidden="true" />}
          {trend.text}
        </p>
      ) : null}
    </div>
  );
}
