import { NextResponse } from "next/server"

// This would be replaced with actual packet capture and analysis in a real implementation
function generateMockNetworkData() {
  const now = new Date()

  // Generate traffic data points for the last 24 hours
  const trafficData = Array.from({ length: 24 }, (_, i) => {
    const timestamp = new Date(now)
    timestamp.setHours(now.getHours() - 23 + i)

    // Create a daily pattern with peaks during work hours
    const hour = timestamp.getHours()
    let baseLine

    if (hour >= 9 && hour <= 17) {
      // Work hours - higher traffic
      baseLine = 80 + Math.random() * 40
    } else if (hour >= 18 && hour <= 22) {
      // Evening - medium traffic
      baseLine = 50 + Math.random() * 30
    } else {
      // Night - low traffic
      baseLine = 20 + Math.random() * 20
    }

    // Add some randomness
    const value = Math.max(10, Math.min(100, baseLine + (Math.random() * 20 - 10)))

    return {
      timestamp: timestamp.toISOString(),
      value,
    }
  })

  // Generate protocol distribution
  const tcpPercentage = 50 + (Math.random() * 10 - 5)
  const udpPercentage = 30 + (Math.random() * 10 - 5)
  const icmpPercentage = 5 + (Math.random() * 2 - 1)
  const otherPercentage = 100 - tcpPercentage - udpPercentage - icmpPercentage

  const protocolDistribution = [
    { protocol: "TCP", percentage: tcpPercentage },
    { protocol: "UDP", percentage: udpPercentage },
    { protocol: "ICMP", percentage: icmpPercentage },
    { protocol: "Other", percentage: otherPercentage },
  ]

  // Generate top talkers
  const topTalkers = Array.from({ length: 10 }, (_, i) => {
    const ip = `192.168.1.${100 + i}`
    const inbound = Math.floor(Math.random() * 500)
    const outbound = Math.floor(Math.random() * 500)

    return {
      ip,
      inbound,
      outbound,
      total: inbound + outbound,
      isAnomalous: outbound > inbound * 3 || inbound > outbound * 3 || inbound + outbound > 800,
    }
  }).sort((a, b) => b.total - a.total)

  // Generate anomalies
  const anomalies = Array.from({ length: 5 }, (_, i) => {
    const timestamp = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000)
    const severity = Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low"
    const type = ["Traffic Spike", "Port Scan", "Data Exfiltration", "Unusual Connection", "Protocol Anomaly"][
      Math.floor(Math.random() * 5)
    ]
    const source = `192.168.1.${Math.floor(Math.random() * 254) + 1}`

    return {
      id: i + 1,
      timestamp: timestamp.toISOString(),
      severity,
      type,
      source,
      score: Math.floor(Math.random() * 100),
      description: `Detected ${type.toLowerCase()} from ${source}`,
    }
  }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return {
    trafficData,
    protocolDistribution,
    topTalkers,
    anomalies,
    stats: {
      devices: 24,
      trafficRate: "1.2 GB/s",
      alertCount: anomalies.filter((a) => a.severity === "high").length,
      anomalyCount: anomalies.length,
    },
  }
}

export async function GET() {
  // In a real implementation, this would process actual network data
  const data = generateMockNetworkData()

  return NextResponse.json(data)
}
