import { Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage.jsx";
import Service from "./pages/Service.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";


export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/service/:id" element={<Service/>} />

      </Routes>
    </div>
  );
}
