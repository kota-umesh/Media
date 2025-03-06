import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import FacebookPost from "./components/FacebookPost";
import axios from "axios";

axios.defaults.withCredentials = true;

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  const backendURL = process.env.BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${backendURL}/auth/check-auth`);
        setIsAuthenticated(res.data.authenticated);
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [backendURL]);

  if (isAuthenticated === null) return <div>Loading...</div>; // Prevents flickering

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/dashboard" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Dashboard /></ProtectedRoute>} />
        <Route path="/facebook-post" element={<ProtectedRoute isAuthenticated={isAuthenticated}><FacebookPost /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
};

// Protects routes from unauthorized access
const ProtectedRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/" />;
};

export default App;
