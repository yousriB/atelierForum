import React from "react";
import { Badge } from "@/components/ui/badge";
import { RepairStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: RepairStatus;
  daysInStatus: number;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  daysInStatus,
  className,
}) => {
  const getStatusVariant = () => {
    if (status === "Prêt") return "ready";
    if (status === "Sortie") return "sortie";
    if (daysInStatus > 3) return "danger";
    if (daysInStatus > 0) return "warning";
    return "default";
  };

  const getStatusColor = () => {
    const variant = getStatusVariant();
    switch (variant) {
      case "ready":
        return "bg-status-ready text-white";
      case "ready":
        return "bg-blue-400 text-white";
      case "danger":
        return "bg-status-danger text-white";
      case "warning":
        return "bg-status-warning text-white";
      default:
        return "bg-status-info text-white";
    }
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Badge className={cn(getStatusColor(), "px-3 py-1")}>{status}</Badge>
      <span className="text-xs text-muted-foreground">
        {daysInStatus} jour{daysInStatus !== 1 ? "s" : ""}
      </span>
    </div>
  );
};
