// components/protocol-distribution.tsx
"use client";

import { useEffect, useRef } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ProtocolDistributionProps {
  data: { [key: string]: number };
}

export default function ProtocolDistribution({
  data,
}: ProtocolDistributionProps) {
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      chart.data.labels = Object.keys(data);
      chart.data.datasets[0].data = Object.values(data);
      chart.update("none"); // Silent update
    }
  }, [data]);

  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        data: Object.values(data),
        backgroundColor: [
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(153, 102, 255, 0.8)",
          "rgba(255, 99, 132, 0.8)",
        ],
        borderColor: [
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 99, 132, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // Disable for real-time
    plugins: {
      legend: {
        position: "right" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || "";
            const value = context.raw || 0;
            return `${label}: ${value.toFixed(1)}%`;
          },
        },
      },
    },
  };

  return (
    <div className="h-[300px] flex items-center justify-center">
      <Doughnut ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
