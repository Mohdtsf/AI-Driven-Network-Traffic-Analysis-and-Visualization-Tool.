// components/traffic-overview.tsx
"use client";

import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

interface TrafficData {
  timestamp: string;
  value: number;
}

interface TrafficOverviewProps {
  data: TrafficData[];
  detailed?: boolean;
}

export default function TrafficOverview({
  data,
  detailed = false,
}: TrafficOverviewProps) {
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      chart.data.labels = data.map((item) => new Date(item.timestamp));
      chart.data.datasets[0].data = data.map((item) => item.value);
      chart.update("none");
    }
  }, [data]);

  const chartData = {
    labels: data.map((item) => new Date(item.timestamp)),
    datasets: [
      {
        label: "Network Traffic (Mbps)",
        data: data.map((item) => item.value),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.4,
        fill: true,
        pointRadius: detailed ? 2 : 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            const value = context.raw || 0;
            return `Traffic: ${value.toFixed(2)} Mbps`;
          },
          title: (tooltipItems: any) => {
            return new Date(tooltipItems[0].label).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              fractionalSecondDigits: 3,
            });
          },
        },
      },
    },
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: detailed ? "second" : ("minute" as const),
          displayFormats: {
            second: "HH:mm:ss.SSS",
            minute: "HH:mm",
          },
        },
        title: {
          display: true,
          text: "Time",
        },
        ticks: {
          maxTicksLimit: 10,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Mbps",
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  return (
    <div className="space-y-4">
      {detailed && (
        <div className="flex space-x-2 mb-4">
          {[
            { label: "10s", seconds: 10 },
            { label: "1m", seconds: 60 },
            { label: "5m", seconds: 300 },
            { label: "1h", seconds: 3600 },
          ].map(({ label, seconds }) => (
            <button
              key={label}
              className={`px-3 py-1 rounded text-sm ${
                data.length > 0 &&
                new Date(data[data.length - 1].timestamp).getTime() -
                  new Date(data[0].timestamp).getTime() <=
                  seconds * 1000
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary"
              }`}
              disabled // Controlled by backend data window
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <div className="h-[300px]">
        {data.length > 0 ? (
          <Line ref={chartRef} data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No traffic data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
