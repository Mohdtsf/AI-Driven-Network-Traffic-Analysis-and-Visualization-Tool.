// components/top-talkers.tsx
"use client";

import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Badge } from "@/components/ui/badge";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TopTalker {
  ip: string;
  name: string;
  inbound: number;
  outbound: number;
  total: number;
  is_anomalous: boolean;
}

interface TopTalkersProps {
  data: TopTalker[];
}

export default function TopTalkers({ data }: TopTalkersProps) {
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      chart.data.labels = data.map((item) => item.ip);
      chart.data.datasets[0].data = data.map((item) => item.inbound);
      chart.data.datasets[1].data = data.map((item) => item.outbound);
      chart.update("none");
    }
  }, [data]);

  const chartData = {
    labels: data.map((item) => item.ip),
    datasets: [
      {
        label: "Inbound (Mbps)",
        data: data.map((item) => item.inbound),
        backgroundColor: "rgba(54, 162, 235, 0.8)",
      },
      {
        label: "Outbound (Mbps)",
        data: data.map((item) => item.outbound),
        backgroundColor: "rgba(255, 99, 132, 0.8)",
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
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || "";
            const value = context.raw || 0;
            return `${label}: ${value.toFixed(2)} Mbps`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
        title: {
          display: true,
          text: "Traffic (Mbps)",
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="h-[300px]">
        <Bar ref={chartRef} data={chartData} options={options} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">IP Address</th>
              <th className="text-left py-2">Name</th>
              <th className="text-right py-2">Inbound (Mbps)</th>
              <th className="text-right py-2">Outbound (Mbps)</th>
              <th className="text-right py-2">Total (Mbps)</th>
              <th className="text-center py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b hover:bg-muted/50">
                <td className="py-2">{item.ip}</td>
                <td className="py-2">
                  {item.name && item.name !== item.ip ? item.name : item.ip}
                </td>
                <td className="text-right py-2">{item.inbound.toFixed(2)}</td>
                <td className="text-right py-2">{item.outbound.toFixed(2)}</td>
                <td className="text-right py-2">{item.total.toFixed(2)}</td>
                <td className="text-center py-2">
                  <Badge
                    variant={item.is_anomalous ? "destructive" : "outline"}
                  >
                    {item.is_anomalous ? "Anomalous" : "Normal"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
