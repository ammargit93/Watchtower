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
  const [serviceName, setServiceName] = useState("");
  const [port, setPort] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  // Fetch all services on load
  useEffect(() => {
    const userid = localStorage.getItem("userid");
    if (!userid) return navigate("/login");

    async function loadServices() {
      try {
        const res = await fetch(`http://localhost:8000/get-services/${userid}`);
        const data = await res.json();
        console.log("Fetched services:", data.services);
        setServices(data.services);
      } catch (err) {
        console.error("Error fetching services:", err);
      }
    }

    loadServices();
  }, [navigate]);

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
    const userid = localStorage.getItem("userid");

    const payload = {
      url: endpoint,
      name: serviceName,
      status: "Unknown",
      userid,
      metrics: selectedMetrics,
    };

    try {
      const res = await fetch("http://localhost:8000/add-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Service saved:", data);

      // Reload services after adding
      const refetch = await fetch(`http://localhost:8000/get-services/${userid}`);
      const refreshed = await refetch.json();
      setServices(refreshed.services);
    } catch (err) {
      console.error("Failed to save service:", err);
    }
    // WebSocket logic (optional)
    const ws = new WebSocket("ws://127.0.0.1:8000/");
    ws.onopen = () => ws.send(endpoint);
    ws.onmessage = (event) => console.log("Received:", event.data);
    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onclose = () => console.log("WebSocket closed");


    setIsModalOpen(false);
    setIp("");
    setPort("");
    setServiceName("");
    setSelectedMetrics([]);
  };

  // Extract IP + port from service.url
  function parseUrl(url) {
    try {
      const u = new URL(url);
      return {
        ip: u.hostname,
        port: u.port,
      };
    } catch {
      return { ip: "N/A", port: "N/A" };
    }
  }

  // Handle click: navigate to service page and fetch metrics there
  const handleServiceClick = (service) => {
    navigate(`/service/${service.id}`, { state: { service } });
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Services</h2>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {services.map((service, index) => {
              const { ip, port } = parseUrl(service.url);
              return (
                <div
                  key={service.id}
                  className="p-4 bg-white shadow rounded-lg hover:shadow-lg transition cursor-pointer"
                  onClick={() => handleServiceClick(service)}
                >

                  <h3 className="font-semibold text-gray-800 text-lg">
                    Service {index + 1}
                  </h3>
                  <p className="text-gray-500 mt-1">IP: {ip}</p>
                  <p className="text-gray-500 mt-1">Port: {port}</p>
                  <p className="text-gray-500 mt-1">URL: {service.url}</p>
                  <span
                    className={`mt-4 block font-semibold ${
                      service.status === "Healthy"
                        ? "text-green-600"
                        : service.status === "Down"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    Status: {service.status}
                  </span>
                </div>
              );
            })}
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
                placeholder="Service Name"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="border p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Service IP"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="border p-2 rounded"
                required
              />
              <input
                type="number"
                placeholder="Port"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="border p-2 rounded"
                required
              />

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
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
