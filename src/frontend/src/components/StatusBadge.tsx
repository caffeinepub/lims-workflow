import React from "react";
import {
  type WorkflowStage,
  getStatusBadgeClass,
  getStatusLabel,
} from "../lib/mockData";

interface StatusBadgeProps {
  status: WorkflowStage;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(status)} ${className}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
