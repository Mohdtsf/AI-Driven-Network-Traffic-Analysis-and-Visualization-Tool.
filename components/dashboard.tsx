// components/dashboard.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import TrafficOverview from "@/components/traffic-overview";
import TopTalkers from "@/components/top-talkers";
import ProtocolDistribution from "@/components/protocol-distribution";
import AnomalyTimeline from "@/components/anomaly-timeline";
import NetworkMap from "@/components/network-map";
import AlertsList from "@/components/alerts-list";
import { fetchNetworkOverview, setupWebSocket } from "@/lib/api";

const initialDashboardData = {
  stats: {
    devices: 0,
    traffic_rate: "0 Mbps",
    alert_count: 0,
    anomaly_count: 0,
  },
  traffic_data: [],
  protocol_distribution: {},
  top_talkers: [],
  recent_anomalies: [],
  devices: [],
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(initialDashboardData);
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce to prevent excessive state updates (batch every 100ms)
  const debounceUpdate = useCallback((newData) => {
    setDashboardData((prev) => {
      const updatedTraffic = [
        ...prev.traffic_data,
        ...(newData.traffic_data || []),
      ].slice(-1000);
      const updatedDevices = (newData.devices || prev.devices).map(
        (device) => ({
          id: device.id,
          name: device.name || device.ip,
          type: device.type || "unknown",
          ip: device.ip,
          connections: device.connections || [],
          anomalous: device.anomalous || false,
          inbound: device.inbound || 0,
          outbound: device.outbound || 0,
          total: device.total || 0,
        })
      );
      const updatedTopTalkers = (newData.top_talkers || prev.top_talkers).map(
        (talker) => ({
          ip: talker.ip,
          name: talker.name || talker.ip,
          inbound: talker.inbound,
          outbound: talker.outbound,
          total: talker.total,
          is_anomalous: talker.is_anomalous,
        })
      );
      return {
        ...prev,
        traffic_data: updatedTraffic,
        protocol_distribution:
          newData.protocol_distribution || prev.protocol_distribution,
        top_talkers: updatedTopTalkers,
        devices: updatedDevices,
        stats: {
          ...prev.stats,
          devices: updatedDevices.length,
          traffic_rate:
            updatedTraffic.length > 0
              ? `${updatedTraffic[updatedTraffic.length - 1].value.toFixed(
                  2
                )} Mbps`
              : prev.stats.traffic_rate,
        },
      };
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchNetworkOverview();
        setDashboardData({
          ...data,
          top_talkers: data.top_talkers.map((talker) => ({
            ...talker,
            name: talker.name || talker.ip,
          })),
          devices: data.devices.map((device) => ({
            ...device,
            name: device.name || device.ip,
            inbound: device.inbound || 0,
            outbound: device.outbound || 0,
            total: device.total || 0,
          })),
        });

        const newAlerts = data.recent_anomalies.map((anomaly, index) => ({
          id: anomaly.id || index + 1,
          title: anomaly.type,
          description: anomaly.description || `Detected from ${anomaly.source}`,
          severity: anomaly.severity,
          timestamp: anomaly.timestamp,
          acknowledged: false,
        }));

        setAlerts((prevAlerts) => {
          const existingIds = new Set(prevAlerts.map((a) => a.id));
          const uniqueNewAlerts = newAlerts.filter(
            (a) => !existingIds.has(a.id)
          );
          return [...prevAlerts, ...uniqueNewAlerts].slice(-100);
        });

        setIsConnected(true);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setIsConnected(false);
        setError("Failed to connect to the monitoring server");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    let lastUpdate = 0;
    const cleanupWebSocket = setupWebSocket((data) => {
      const now = Date.now();
      if (now - lastUpdate >= 100) {
        if (data.traffic_data) {
          debounceUpdate(data);
        }

        if (data.anomalies && data.anomalies.length > 0) {
          const newAlerts = data.anomalies.map((anomaly, index) => ({
            id: anomaly.id || Date.now() + index,
            title: anomaly.type,
            description:
              anomaly.description || `Detected from ${anomaly.source}`,
            severity: anomaly.severity,
            timestamp: anomaly.timestamp,
            acknowledged: false,
          }));

          setAlerts((prevAlerts) => {
            const existingIds = new Set(prevAlerts.map((a) => a.id));
            const uniqueNewAlerts = newAlerts.filter(
              (a) => !existingIds.has(a.id)
            );
            return [...prevAlerts, ...uniqueNewAlerts].slice(-100);
          });

          setDashboardData((prev) => ({
            ...prev,
            recent_anomalies: [
              ...prev.recent_anomalies,
              ...data.anomalies,
            ].slice(-100),
            stats: {
              ...prev.stats,
              anomaly_count: prev.stats.anomaly_count + data.anomalies.length,
              alert_count:
                prev.stats.alert_count +
                data.anomalies.filter(
                  (a) => a.severity === "high" || a.severity === "medium"
                ).length,
            },
          }));
        }
        lastUpdate = now;
      }
    });

    return () => {
      cleanupWebSocket();
    };
  }, [debounceUpdate]);

  const acknowledgeAlert = (id) => {
    setAlerts(
      alerts.map((alert) =>
        alert.id === id ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  if (isLoading && !dashboardData.traffic_data.length) {
    return (
      <div className="flex justify-center items-center p-8">
        Loading dashboard data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isConnected && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Lost</AlertTitle>
          <AlertDescription>
            {error ||
              "Connection to the monitoring server has been lost. Attempting to reconnect..."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Network Status</CardTitle>
            <CardDescription>
              Current network health and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-2xl font-bold">Active</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={isConnected ? "default" : "destructive"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Devices</p>
                <p className="text-xl font-bold">
                  {dashboardData.stats.devices}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Traffic</p>
                <p className="text-xl font-bold">
                  {dashboardData.stats.traffic_rate}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Alerts</p>
                <p className="text-xl font-bold">{unacknowledgedCount}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Anomalies</p>
                <p className="text-xl font-bold">
                  {dashboardData.stats.anomaly_count}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>
              Anomalies detected by the AI system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts
                .filter((a) => !a.acknowledged)
                .slice(0, 2)
                .map((alert) => (
                  <Alert
                    key={alert.id}
                    variant={
                      alert.severity === "high" ? "destructive" : "default"
                    }
                    className="relative"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{alert.title}</AlertTitle>
                    <AlertDescription>{alert.description}</AlertDescription>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  </Alert>
                ))}
              {unacknowledgedCount === 0 && (
                <div className="flex items-center justify-center p-4 text-center">
                  <div>
                    <CheckCircle2 className="mx-auto h-8 w-8 text-green-500 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No unacknowledged alerts
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Overview</CardTitle>
                <CardDescription>
                  Real-time network traffic (Mbps)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrafficOverview data={dashboardData.traffic_data} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Protocol Distribution</CardTitle>
                <CardDescription>Real-time protocol usage (%)</CardDescription>
              </CardHeader>
              <CardContent>
                <ProtocolDistribution
                  data={dashboardData.protocol_distribution}
                />
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Top Talkers</CardTitle>
                <CardDescription>
                  Most active devices on the network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TopTalkers data={dashboardData.top_talkers} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Anomaly Timeline</CardTitle>
              <CardDescription>Real-time detected anomalies</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <AnomalyTimeline anomalies={dashboardData.recent_anomalies} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Network Map</CardTitle>
              <CardDescription>Real-time connected devices</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <NetworkMap devices={dashboardData.devices} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Traffic Analysis</CardTitle>
              <CardDescription>
                Real-time traffic patterns (Mbps)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrafficOverview
                data={dashboardData.traffic_data}
                detailed={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>Real-time anomaly alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertsList alerts={alerts} onAcknowledge={acknowledgeAlert} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
