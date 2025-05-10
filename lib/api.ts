// lib/api.ts
import { io } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchNetworkOverview() {
  try {
    const response = await fetch(`${API_URL}/api/network/overview`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching network overview:", error);
    throw error;
  }
}

export async function fetchTrafficData(hours = 24) {
  try {
    const response = await fetch(
      `${API_URL}/api/network/traffic?hours=${hours}`
    );
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching traffic data:", error);
    throw error;
  }
}

export async function fetchAnomalies(options = { hours: 24, severity: null }) {
  try {
    let url = `${API_URL}/api/network/anomalies?hours=${options.hours}`;
    if (options.severity) {
      url += `&severity=${options.severity}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching anomalies:", error);
    throw error;
  }
}

export async function fetchDevices() {
  try {
    const response = await fetch(`${API_URL}/api/network/devices`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching devices:", error);
    throw error;
  }
}

export async function fetchTopTalkers() {
  try {
    const response = await fetch(`${API_URL}/api/network/top-talkers`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching top talkers:", error);
    throw error;
  }
}

export function setupWebSocket(onMessage: (data: any) => void) {
  const socket = io(API_URL, {
    transports: ["websocket"],
    path: "/socket.io",
  });

  socket.on("connect", () => {
    console.log("Socket.IO connection established");
  });

  socket.on("network_update", (data) => {
    onMessage(data);
  });

  socket.on("new_anomalies", (data) => {
    onMessage({ anomalies: data });
  });

  socket.on("connect_error", (error) => {
    console.error("Socket.IO connection error:", error);
  });

  socket.on("disconnect", () => {
    console.log("Socket.IO connection closed");
  });

  return () => {
    socket.disconnect();
  };
}
