import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Homepage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ip, setIp] = useState("");
  const [port, setPort] = useState("");
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  // Fetch services on mount (optional)
  useEffect(() => {
    // Fetch services from backend if needed
  }, []);

  const handleAddService = () => setIsModalOpen(true);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = `http://${ip}:${port}/metrics/`;

    // Open WebSocket connection
    const ws = new WebSocket("ws://127.0.0.1:8000/");

    ws.onopen = () => {
      console.log("WebSocket connected");
      ws.send(endpoint);
    };

    ws.onmessage = (event) => {
      console.log("Received from backend:", event.data);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    const newService = {
      ip,
      port: Number(port),
      endpoint,
      name: `Service ${services.length + 1}`,
      status: "Unknown",
    };

    setServices((prev) => [...prev, newService]);

    // Reset modal
    setIsModalOpen(false);
    setIp("");
    setPort("");
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
        {/* Navbar */}
        <div className="w-full h-16 bg-white shadow flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
          <button
            onClick={handleAddService}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Add Service
          </button>
        </div>

        {/* Content */}
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
