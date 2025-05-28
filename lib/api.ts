import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
let socket: Socket | null = null;

export async function fetchNetworkOverview(token: string | null) {
  try {
    const response = await fetch(`${API_URL}/api/network/overview`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching network overview:", error);
    throw error;
  }
}

export async function fetchTrafficData(token: string | null, hours = 24) {
  try {
    const response = await fetch(
      `${API_URL}/api/network/traffic?hours=${hours}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
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

export async function fetchAnomalies(
  token: string | null,
  options = { hours: 24, severity: null }
) {
  try {
    let url = `${API_URL}/api/network/anomalies?hours=${options.hours}`;
    if (options.severity) {
      url += `&severity=${options.severity}`;
    }
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching anomalies:", error);
    throw error;
  }
}

export async function fetchDevices(token: string | null) {
  try {
    const response = await fetch(`${API_URL}/api/network/devices`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching devices:", error);
    throw error;
  }
}

export async function fetchTopTalkers(token: string | null) {
  try {
    const response = await fetch(`${API_URL}/api/network/top-talkers`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching top talkers:", error);
    throw error;
  }
}

export function setupWebSocket(
  token: string | null,
  onMessage: (data: any) => void
) {
  if (!token) {
    console.error("No token available for WebSocket connection");
    return () => {};
  }

  socket = io(API_URL, {
    transports: ["websocket"],
    path: "/socket.io",
    auth: {
      token: token, // Pass token in the auth object
    },
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
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  };
}
