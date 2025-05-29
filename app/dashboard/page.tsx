"use client";
import { Suspense } from "react";
import Dashboard from "@/components/dashboard";
import LoadingDashboard from "@/components/loading-dashboard";

export default function Home() {
  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      {/* Complex Geometric Background Pattern */}
      <div className="absolute inset-0">
        {/* Corner geometric shapes with connecting lines */}
        {/* Top Left Corner Complex */}
        <div className="absolute top-12 left-12">
          <div className="w-24 h-24 border border-gray-600 transform rotate-45 opacity-40"></div>
          <div className="absolute top-2 left-2 w-4 h-4 bg-white opacity-60 rounded-full"></div>
          <div className="absolute -top-1 -left-1 w-6 h-6 border border-gray-500 opacity-30"></div>
        </div>

        {/* Top Right Corner Complex */}
        <div className="absolute top-12 right-12">
          <div className="w-24 h-24 border border-gray-600 transform rotate-45 opacity-40"></div>
          <div className="absolute top-2 right-2 w-4 h-4 bg-white opacity-60 rounded-full"></div>
          <div className="absolute -top-1 -right-1 w-6 h-6 border border-gray-500 opacity-30"></div>
        </div>

        {/* Bottom Left Corner Complex */}
        <div className="absolute bottom-12 left-12">
          <div className="w-24 h-24 border border-gray-600 transform rotate-45 opacity-40"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 bg-white opacity-60 rounded-full"></div>
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border border-gray-500 opacity-30"></div>
        </div>

        {/* Bottom Right Corner Complex */}
        <div className="absolute bottom-12 right-12">
          <div className="w-24 h-24 border border-gray-600 transform rotate-45 opacity-40"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 bg-white opacity-60 rounded-full"></div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border border-gray-500 opacity-30"></div>
        </div>

        {/* Connecting lines from corners to center */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop
                offset="0%"
                style={{ stopColor: "transparent", stopOpacity: 0 }}
              />
              <stop
                offset="20%"
                style={{ stopColor: "#4B5563", stopOpacity: 0.3 }}
              />
              <stop
                offset="80%"
                style={{ stopColor: "#4B5563", stopOpacity: 0.3 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "transparent", stopOpacity: 0 }}
              />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "transparent", stopOpacity: 0 }}
              />
              <stop
                offset="20%"
                style={{ stopColor: "#4B5563", stopOpacity: 0.3 }}
              />
              <stop
                offset="80%"
                style={{ stopColor: "#4B5563", stopOpacity: 0.3 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "transparent", stopOpacity: 0 }}
              />
            </linearGradient>
          </defs>

          {/* Horizontal connecting lines */}
          <line
            x1="120"
            y1="60"
            x2="50%"
            y2="50%"
            stroke="url(#grad1)"
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1="calc(100% - 120)"
            y1="60"
            x2="50%"
            y2="50%"
            stroke="url(#grad1)"
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1="120"
            y1="calc(100% - 60)"
            x2="50%"
            y2="50%"
            stroke="url(#grad1)"
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1="calc(100% - 120)"
            y1="calc(100% - 60)"
            x2="50%"
            y2="50%"
            stroke="url(#grad1)"
            strokeWidth="1"
            opacity="0.4"
          />

          {/* Additional geometric lines */}
          <line
            x1="0"
            y1="30%"
            x2="25%"
            y2="50%"
            stroke="url(#grad1)"
            strokeWidth="1"
            opacity="0.2"
          />
          <line
            x1="100%"
            y1="30%"
            x2="75%"
            y2="50%"
            stroke="url(#grad1)"
            strokeWidth="1"
            opacity="0.2"
          />
          <line
            x1="0"
            y1="70%"
            x2="25%"
            y2="50%"
            stroke="url(#grad1)"
            strokeWidth="1"
            opacity="0.2"
          />
          <line
            x1="100%"
            y1="70%"
            x2="75%"
            y2="50%"
            stroke="url(#grad1)"
            strokeWidth="1"
            opacity="0.2"
          />
        </svg>

        {/* Additional floating geometric elements */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-gray-400 opacity-30 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-3 h-3 border border-gray-500 opacity-25 transform rotate-45"></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-gray-400 opacity-30 rounded-full"></div>
        <div className="absolute bottom-1/3 right-1/3 w-3 h-3 border border-gray-500 opacity-25 transform rotate-45"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <h1 className="text-3xl font-bold mb-6 text-white">
          Network Traffic Analysis Dashboard
        </h1>
        <Suspense fallback={<LoadingDashboard />}>
          <Dashboard />
        </Suspense>
      </div>
    </main>
  );
}
