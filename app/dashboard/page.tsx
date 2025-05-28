import { Suspense } from "react";
import Dashboard from "@/components/dashboard";
import LoadingDashboard from "@/components/loading-dashboard";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
          Network Traffic Analysis Dashboard
        </h1>
        <Suspense fallback={<LoadingDashboard />}>
          <Dashboard />
        </Suspense>
      </div>
    </main>
  );
}
