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

  const [service, setService] = useState(location.state?.service || null);
  const [activeUsersData, setActiveUsersData] = useState([]);
  const [memoryUsageData, setMemoryUsageData] = useState([]);
  const [requestMetrics, setRequestMetrics] = useState([]);
  const [loading, setLoading] = useState(!service);

  // Fetch service if not passed via state
  useEffect(() => {
    if (service) return;

    async function fetchService() {
      try {
        const res = await fetch(`http://localhost:8000/get-service/${id}`);
        const data = await res.json();
        setService(data.service);
      } catch (err) {
        console.error("Failed to fetch service:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchService();
  }, [id, service]);

  // WebSocket for live metrics
  useEffect(() => {
    if (!service) return;

    const ws = new WebSocket("ws://localhost:8000/");

    ws.onopen = () => {
      console.log("WebSocket connected");
      ws.send(service.url);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const timeStr = new Date().toLocaleTimeString();

        // Chart data
        if (data.metrics?.other) {
          const other = data.metrics.other;
          const activeUserMetric = other.find((m) => m.name.toLowerCase().includes("active"));
          const memoryMetric = other.find((m) => m.name.toLowerCase().includes("memory"));

          if (activeUserMetric) {
            setActiveUsersData((prev) => [
              ...prev.slice(-20),
              { time: timeStr, activeUsers: activeUserMetric.value },
            ]);
          }

          if (memoryMetric) {
            setMemoryUsageData((prev) => [
              ...prev.slice(-20),
              { time: timeStr, memoryUsage: memoryMetric.value },
            ]);
          }
        }

        // Table data for HTTP metrics
        const requests = data.metrics?.requests || [];
        const errors = data.metrics?.errors || [];

        // Combine requests + errors by endpoint
        const endpointMap = {};
        requests.forEach((r) => {
          const key = r.endpoint || "unknown";
          if (!endpointMap[key]) endpointMap[key] = { endpoint: key, requestCount: 0, errorCount: 0 };
          endpointMap[key].requestCount += r.value;
        });

        errors.forEach((e) => {
          const key = e.endpoint || "unknown";
          if (!endpointMap[key]) endpointMap[key] = { endpoint: key, requestCount: 0, errorCount: 0 };
          endpointMap[key].errorCount += e.value;
        });

        setRequestMetrics(Object.values(endpointMap));

      } catch (err) {
        console.error("Failed to parse WebSocket data:", err);
      }
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onclose = () => console.log("WebSocket closed");

    return () => ws.close();
  }, [service]);

  if (loading) {
    return (
      <div className="p-6 text-gray-700 text-lg font-medium">
        Loading service data...
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-6 text-red-600 text-lg font-medium">
        Service data not found!
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Service Info */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {service.service_name || `Service ${service.id}`} Analytics
        </h1>
        <div className="flex flex-wrap gap-6 text-gray-700">
          <p>
            <span className="font-semibold">Endpoint:</span> {service.url}
          </p>
          <p>
            <span className="font-semibold">Status:</span>{" "}
            <span
              className={
                service.status === "Healthy"
                  ? "text-green-600 font-semibold"
                  : service.status === "Down"
                  ? "text-red-600 font-semibold"
                  : "text-yellow-600 font-semibold"
              }
            >
              {service.status}
            </span>
          </p>
        </div>
      {/* </div> */}

      {/* Active Users Chart */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Active Users Over Time
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={activeUsersData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="linear"
              dataKey="activeUsers"
              stroke="#4f46e5"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>

      {/* Memory Usage Chart */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Memory Usage (MB) Over Time
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={memoryUsageData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="linear"
              dataKey="memoryUsage"
              stroke="#16a34a"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>

      {/* HTTP Metrics Table */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          HTTP Metrics by Endpoint
        </h2>
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left">Endpoint</th>
              <th className="border px-4 py-2">Request Count</th>
              <th className="border px-4 py-2">Error Count</th>
            </tr>
          </thead>
          <tbody>
            {requestMetrics.map((row) => (
              <tr key={row.endpoint}>
                <td className="border px-4 py-2">{row.endpoint}</td>
                <td className="border px-4 py-2">{row.requestCount}</td>
                <td className="border px-4 py-2">{row.errorCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );
}
