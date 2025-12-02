import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Service() {
  const { id } = useParams();
  const location = useLocation();
  const service = location.state?.service;
  const [activeUsersData, setActiveUsersData] = useState([]);

  useEffect(() => {
    if (!service) return;

    const ws = new WebSocket("ws://localhost:8000/");

    ws.onopen = () => {
      console.log("WebSocket connected");
      ws.send(service.endpoint);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.activeUsers !== undefined) {
          const timeStr = new Date().toLocaleTimeString();
          setActiveUsersData((prev) => [
            ...prev.slice(-20), // keep last 20 points
            { time: timeStr, activeUsers: data.activeUsers },
          ]);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket data:", err);
      }
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onclose = () => console.log("WebSocket closed");

    return () => ws.close();
  }, [service]);

  if (!service) {
    return <p className="p-6 text-red-600">Service data not found!</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Analytics for {service.name}</h1>
      <p><strong>IP:</strong> {service.ip}</p>
      <p><strong>Port:</strong> {service.port}</p>
      <p><strong>Endpoint:</strong> {service.endpoint}</p>
      <p><strong>Status:</strong> {service.status}</p>

      {/* Active Users Graph */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Active Users Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={activeUsersData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="activeUsers" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
