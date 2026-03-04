import React, { useState, useEffect } from "react";

interface SLACountdownProps {
  deadline: string;
  createdAt?: string;
}

function getTimeRemaining(deadline: string) {
  const now = Date.now();
  const end = new Date(deadline).getTime();
  const diff = end - now;
  if (diff <= 0) return { label: "Overdue", pct: 0, color: "sla-red" as const };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  let label = "";
  if (days > 0) label = `${days}d ${hours}h`;
  else if (hours > 0) label = `${hours}h ${mins}m`;
  else label = `${mins}m`;
  return { label, diff, pct: 0, color: "sla-green" as const };
}

function getSLAColor(
  deadline: string,
  createdAt?: string,
): "sla-green" | "sla-yellow" | "sla-red" {
  const now = Date.now();
  const end = new Date(deadline).getTime();
  const start = createdAt ? new Date(createdAt).getTime() : end - 7 * 86400000;
  const total = end - start;
  const remaining = end - now;
  if (remaining <= 0) return "sla-red";
  const pct = (remaining / total) * 100;
  if (pct > 50) return "sla-green";
  if (pct > 25) return "sla-yellow";
  return "sla-red";
}

export function SLACountdown({ deadline, createdAt }: SLACountdownProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const { label } = getTimeRemaining(deadline);
  const color = getSLAColor(deadline, createdAt);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
