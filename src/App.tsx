// src/App.tsx
import { Routes, Route, Link } from "react-router-dom";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import ForgotPassword from "./pages/auth/ForgotPassword";
import OTPVerification from "./pages/auth/OTPVerification";
import ResetPassword from "./pages/auth/ResetPassword";

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="logo">R</div>
          <div>
            <h1>ReflectionSync</h1>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Floor Plan Manager</div>
          </div>
        </div>
        <div>
          <Link to="/login" className="link" style={{ marginRight: 12 }}>Login</Link>
          <Link to="/signup" className="link">Register</Link>
        </div>
      </header>

      <section className="grid">
        <div className="panel-left">
          <h2>Welcome to Floor Plan Management</h2>
          <p>Upload floorplans, draw rooms/seats, manage overlays and create bookings - all from a simple interface.</p>
          <ul className="features">
            <li>Upload image / PDF floorplans</li>
            <li>Create & edit rooms and seats on an interactive canvas</li>
            <li>Book rooms and detect conflicts</li>
          </ul>
        </div>

        <div>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><div className="card">Admin area</div></AdminRoute>} />
            <Route path="/auth/forgot" element={<ForgotPassword />} />
            <Route path="/auth/otp" element={<OTPVerification />} />
            <Route path="/auth/reset" element={<ResetPassword />} />

          </Routes>
        </div>
      </section>
    </div>
  );
}