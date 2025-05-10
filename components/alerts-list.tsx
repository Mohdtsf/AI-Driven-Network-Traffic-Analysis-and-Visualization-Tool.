// components/alerts-list.tsx
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle, Search, X } from "lucide-react";

interface Alert {
  id: number;
  title: string;
  description: string;
  severity: string;
  timestamp: string;
  acknowledged: boolean;
}

interface AlertsListProps {
  alerts: Alert[];
  onAcknowledge: (id: number) => void;
}

export default function AlertsList({ alerts, onAcknowledge }: AlertsListProps) {
  const [filter, setFilter] = useState("");
  const [showAcknowledged, setShowAcknowledged] = useState(true);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSearch =
        alert.title.toLowerCase().includes(filter.toLowerCase()) ||
        alert.description.toLowerCase().includes(filter.toLowerCase());
      const matchesStatus = showAcknowledged || !alert.acknowledged;
      return matchesSearch && matchesStatus;
    });
  }, [alerts, filter, showAcknowledged]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            className="pl-8"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {filter && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9"
              onClick={() => setFilter("")}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
        <Button
          variant={showAcknowledged ? "default" : "outline"}
          onClick={() => setShowAcknowledged(!showAcknowledged)}
          className="whitespace-nowrap"
        >
          {showAcknowledged ? "Hide Acknowledged" : "Show Acknowledged"}
        </Button>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <CheckCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No alerts found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {filter
              ? "Try adjusting your search terms."
              : "You're all caught up!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`relative rounded-lg border p-4 ${
                alert.acknowledged ? "bg-muted/50" : "bg-background"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`mt-0.5 rounded-full p-1 ${
                      alert.severity === "high"
                        ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                        : alert.severity === "medium"
                        ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    }`}
                  >
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">
                      {alert.title}
                      {alert.acknowledged && (
                        <Badge variant="outline" className="ml-2">
                          Acknowledged
                        </Badge>
                      )}
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {alert.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        fractionalSecondDigits: 3,
                      })}
                    </p>
                  </div>
                </div>
                {!alert.acknowledged && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAcknowledge(alert.id)}
                  >
                    Acknowledge
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
