"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

if (typeof window !== "undefined") {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
  );
}

export type ChartType = "line" | "bar" | "donut";

interface ChartCardProps {
  type: ChartType;
  title: string;
  data: any;
  options?: any;
  className?: string;
}

export function ChartCard({
  type,
  title,
  data,
  options,
  className,
}: ChartCardProps) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: "Inter",
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: type !== "donut" ? {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: "rgba(200, 200, 200, 0.1)",
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    } : undefined,
  };

  const ChartComponent = {
    line: Line,
    bar: Bar,
    donut: Doughnut,
  }[type];

  return (
    <Card className={className}>
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-semibold">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[220px] w-full">
          <ChartComponent data={data} options={options || defaultOptions} />
        </div>
      </CardContent>
    </Card>
  );
}
