import React, { useState } from "react";
import axios from "axios";
import { message, Spin } from "antd";
import "./Login.css";
import { useNavigate } from "react-router-dom";

const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${backendUrl}/api/login`, {
        email,
        password,
      });

      localStorage.setItem("authToken", response.data.token);
      navigate("/Dashboard");
    } catch (error) {
      message.error("Login failed: " + (error.response?.data?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? <Spin /> : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
