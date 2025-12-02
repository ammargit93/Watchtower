import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ALL_METRICS = [
  "REQUEST_COUNT",
  "ERROR_COUNT",
  "MEMORY_USAGE",
  "ACTIVE_USERS",
  "REQUEST_LATENCY",
  "RESPONSE_SIZE",
];

export default function Homepage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ip, setIp] = useState("");
  const [port, setPort] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Optional: fetch services from backend
  }, []);

  const handleAddService = () => setIsModalOpen(true);

  const toggleMetric = (metric) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = `http://${ip}:${port}/metrics/`;

    // Read user ID from localStorage
    const userid = localStorage.getItem("userid");

    const payload = {
      url: endpoint,
      status: "Unknown",
      userid,
      metrics: selectedMetrics,
    };

    console.log("Payload being sent:", payload);

    // POST to backend
    try {
      const res = await fetch("http://localhost:8000/add-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Service saved:", data);
    } catch (err) {
      console.error("Failed to save service:", err);
    }

    // WebSocket logic (optional)
    const ws = new WebSocket("ws://127.0.0.1:8000/");
    ws.onopen = () => ws.send(endpoint);
    ws.onmessage = (event) => console.log("Received:", event.data);
    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onclose = () => console.log("WebSocket closed");

    // Save service locally
    const newService = {
      ip,
      port: Number(port),
      endpoint,
      name: `Service ${services.length + 1}`,
      status: "Unknown",
      metrics: selectedMetrics,
    };

    setServices((prev) => [...prev, newService]);

    // Reset modal
    setIsModalOpen(false);
    setIp("");
    setPort("");
    setSelectedMetrics([]);
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md flex flex-col p-6">
        <h2 className="text-2xl font-bold mb-8">Watchtower</h2>
        <nav className="flex flex-col gap-3 text-gray-700">
          <button className="text-left px-3 py-2 rounded hover:bg-gray-200 transition">Dashboard</button>
          <button className="text-left px-3 py-2 rounded hover:bg-gray-200 transition">Services</button>
          <button className="text-left px-3 py-2 rounded hover:bg-gray-200 transition">Alerts</button>
          <button className="text-left px-3 py-2 rounded hover:bg-gray-200 transition">Settings</button>
        </nav>
      </div>

      {/* Main Section */}
      <div className="flex-1 flex flex-col">
        <div className="w-full h-16 bg-white shadow flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
          <button
            onClick={handleAddService}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Add Service
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Watchtower</h2>
            <p className="text-gray-600">This is your mini Signoz-style monitoring dashboard.</p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {services.map((service, index) => (
              <div
                key={index}
                className="p-4 bg-white shadow rounded-lg flex flex-col justify-between hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`/service/${index}`, { state: { service } })}
              >
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">{service.name || `Service ${index + 1}`}</h3>
                  <p className="text-gray-500 mt-1">
                    IP: {service.ip} | Port: {service.port}
                  </p>
                  <p className="text-gray-500 mt-1">
                    Metrics: {service.metrics?.join(", ") || "None"}
                  </p>
                </div>
                <span
                  className={`mt-4 font-semibold ${
                    service.status === "Healthy"
                      ? "text-green-600"
                      : service.status === "Down"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  Status: {service.status || "Unknown"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-96">
            <h3 className="text-xl font-semibold mb-4">Add New Service</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Service IP"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                placeholder="Port"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              {/* Metrics Selection */}
              <p className="font-semibold mt-2">Select Metrics</p>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded">
                {ALL_METRICS.map((metric) => (
                  <label key={metric} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric)}
                      onChange={() => toggleMetric(metric)}
                    />
                    <span>{metric}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
