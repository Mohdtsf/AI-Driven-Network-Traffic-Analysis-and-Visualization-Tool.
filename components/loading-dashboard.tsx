// components/loading-dashboard.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoadingDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-[180px]" />
            <Skeleton className="h-4 w-[250px] mt-2" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-8 w-[80px] mt-2" />
              </div>
              <Skeleton className="h-6 w-[100px]" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-6 w-[60px] mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-4 w-[250px] mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  );
}
