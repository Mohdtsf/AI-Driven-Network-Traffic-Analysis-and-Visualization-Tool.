// components/anomaly-timeline.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Line } from "react-chartjs-2";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface Anomaly {
  id: number;
  timestamp: string;
  severity: string;
  type: string;
  source: string;
  score: number;
  description?: string;
}

interface AnomalyTimelineProps {
  anomalies: Anomaly[];
}

export default function AnomalyTimeline({ anomalies }: AnomalyTimelineProps) {
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const chartRef = useRef<any>(null);

  // Update chart data silently when anomalies change
  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      chart.data.datasets[0].data = anomalies.map((a) => ({
        x: new Date(a.timestamp),
        y: a.score,
        severity: a.severity,
        type: a.type,
        source: a.source,
      }));
      chart.data.datasets[0].backgroundColor = anomalies.map((a) => {
        if (a.severity === "high") return "rgba(255, 99, 132, 1)";
        if (a.severity === "medium") return "rgba(255, 159, 64, 1)";
        return "rgba(255, 205, 86, 1)";
      });
      chart.data.datasets[0].pointRadius = anomalies.map((a) => {
        if (a.severity === "high") return 8;
        if (a.severity === "medium") return 6;
        return 4;
      });
      chart.update("none"); // Silent update to avoid flickering
    }
  }, [anomalies]);

  const chartData = {
    datasets: [
      {
        label: "Anomaly Score",
        data: anomalies.map((a) => ({
          x: new Date(a.timestamp),
          y: a.score,
          severity: a.severity,
          type: a.type,
          source: a.source,
        })),
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: anomalies.map((a) => {
          if (a.severity === "high") return "rgba(255, 99, 132, 1)";
          if (a.severity === "medium") return "rgba(255, 159, 64, 1)";
          return "rgba(255, 205, 86, 1)";
        }),
        pointRadius: anomalies.map((a) => {
          if (a.severity === "high") return 8;
          if (a.severity === "medium") return 6;
          return 4;
        }),
        pointHoverRadius: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // Disable for real-time updates
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: "hour" as const,
          displayFormats: {
            hour: "HH:mm",
          },
        },
        title: {
          display: true,
          text: "Time",
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "Anomaly Score",
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const point = context.raw;
            return [
              `Type: ${point.type}`,
              `Source: ${point.source}`,
              `Severity: ${point.severity}`,
              `Score: ${point.y}`,
            ];
          },
          title: (tooltipItems: any) => {
            return new Date(tooltipItems[0].raw.x).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              fractionalSecondDigits: 3,
            });
          },
        },
      },
    },
    onClick: (_: any, elements: any) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        setSelectedAnomaly(anomalies[index]);
      } else {
        setSelectedAnomaly(null);
      }
    },
  };

  // Description mapping for anomaly types
  const getDescription = (type: string) => {
    switch (type) {
      case "Traffic Spike":
        return "Unusual increase in network traffic volume detected.";
      case "Port Scan":
        return "Multiple ports accessed sequentially, potential reconnaissance activity.";
      case "Data Exfiltration":
        return "Large amount of data transferred to external destination.";
      case "Unusual Connection":
        return "Connection to previously unseen external endpoint.";
      case "Protocol Anomaly":
        return "Unusual protocol behavior or non-standard implementation detected.";
      default:
        return (
          anomalies.find((a) => a.type === type)?.description ||
          "No description available."
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="h-[400px]">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>

      {selectedAnomaly && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">{selectedAnomaly.type}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedAnomaly.timestamp).toLocaleString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    fractionalSecondDigits: 3,
                  })}
                </p>
              </div>
              <Badge
                variant={
                  selectedAnomaly.severity === "high"
                    ? "destructive"
                    : selectedAnomaly.severity === "medium"
                    ? "default"
                    : "outline"
                }
              >
                {selectedAnomaly.severity}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Source</p>
                <p>{selectedAnomaly.source}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Score</p>
                <p>{selectedAnomaly.score}/100</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground">
                {getDescription(selectedAnomaly.type)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
