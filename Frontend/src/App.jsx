import { Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage.jsx";
import Service from "./pages/Service.jsx";
export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/service/:id" element={<Service/>} />

      </Routes>
    </div>
  );
}
