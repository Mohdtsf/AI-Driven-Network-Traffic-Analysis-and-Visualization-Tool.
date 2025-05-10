// components/network-map.tsx
"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface Device {
  id: string;
  name: string;
  type: string;
  ip: string;
  connections: string[];
  anomalous?: boolean;
  inbound?: number;
  outbound?: number;
  total?: number;
}

interface NetworkMapProps {
  devices: Device[];
}

export default function NetworkMap({ devices }: NetworkMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Format bytes to KB, MB, GB, etc.
  const formatBytes = (mbps: number) => {
    const bytesPerSecond = (mbps * 1_000_000) / 8; // Convert Mbps to bytes/s
    const units = ["B/s", "KB/s", "MB/s", "GB/s", "TB/s"];
    let value = bytesPerSecond;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
  };

  useEffect(() => {
    if (!svgRef.current) return;

    // Prepare nodes and links
    const nodes = devices.map((d) => ({
      id: d.ip,
      name: d.name || d.ip,
      type: d.type || "client",
      ip: d.ip,
      anomalous: d.anomalous || false,
    }));

    // Create links from connections
    const links = devices
      .flatMap((d) =>
        d.connections.map((targetIp) => ({
          source: d.ip,
          target: targetIp,
          value: d.anomalous ? 8 : 2,
          anomalous: d.anomalous || false,
        }))
      )
      .filter((link) => nodes.some((n) => n.id === link.target));

    const width = svgRef.current.clientWidth;
    const height = 500;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    // Create SVG container
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Create force simulation
    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(0, 0))
      .force("collision", d3.forceCollide().radius(30));

    // Add links
    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke-width", (d: any) => d.value)
      .attr("stroke", (d: any) => (d.anomalous ? "#ef4444" : "#999"))
      .attr("stroke-opacity", 0.6);

    // Create node groups
    const node = svg
      .append("g")
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended) as any
      );

    // Add circles for nodes
    node
      .append("circle")
      .attr("r", (d: any) => {
        if (d.type === "router") return 15;
        if (d.type === "switch") return 12;
        if (d.type === "server") return 10;
        return 8;
      })
      .attr("fill", (d: any) => {
        if (d.anomalous) return "#ef4444";
        if (d.type === "router") return "#3b82f6";
        if (d.type === "switch") return "#10b981";
        if (d.type === "server") return "#8b5cf6";
        return "#6b7280";
      });

    // Add labels
    node
      .append("text")
      .attr("dx", 15)
      .attr("dy", ".35em")
      .text((d: any) => d.name)
      .style("font-size", "10px")
      .style("fill", "currentColor");

    // Add IP addresses
    node
      .append("text")
      .attr("dx", 15)
      .attr("dy", "1.5em")
      .text((d: any) => d.ip)
      .style("font-size", "8px")
      .style("fill", "currentColor")
      .style("opacity", 0.7);

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x}, ${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Add zoom
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 5])
      .on("zoom", (event) => {
        svg.attr("transform", event.transform);
      });

    d3.select(svgRef.current).call(zoom as any);

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [devices]);

  return (
    <div className="w-full space-y-6">
      <div className="overflow-hidden">
        <svg ref={svgRef} className="w-full h-[500px]"></svg>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Name</th>
              <th className="text-left py-2">IP Address</th>
              <th className="text-left py-2">Connected Devices</th>
              <th className="text-right py-2">Inbound</th>
              <th className="text-right py-2">Outbound</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device, index) => {
              // Map connections to names and IPs
              const connectedDevices =
                device.connections
                  .map((targetIp) => {
                    const targetDevice = devices.find((d) => d.ip === targetIp);
                    return targetDevice
                      ? `${targetDevice.name || targetIp} (${targetIp})`
                      : targetIp;
                  })
                  .join(", ") || "None";

              return (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="py-2">{device.name || device.ip}</td>
                  <td className="py-2">{device.ip}</td>
                  <td className="py-2">{connectedDevices}</td>
                  <td className="text-right py-2">
                    {device.inbound ? formatBytes(device.inbound) : "0 B/s"}
                  </td>
                  <td className="text-right py-2">
                    {device.outbound ? formatBytes(device.outbound) : "0 B/s"}
                  </td>
                  <td className="text-right py-2">
                    {device.total ? formatBytes(device.total) : "0 B/s"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
