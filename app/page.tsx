"use client";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Dashboard from "@/components/dashboard";
import LoadingDashboard from "@/components/loading-dashboard";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Handle redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // If not authenticated, return null to prevent rendering the dashboard
  if (!isAuthenticated) {
    return null;
  }

  return (
    <main>
      <div>
        <Suspense fallback={<LoadingDashboard />}>
          <Dashboard />
        </Suspense>
      </div>
    </main>
  );
}
