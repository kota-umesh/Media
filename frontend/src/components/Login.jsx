import React, { useState } from "react";
import axios from "axios";
import "./Login.css";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
  
    const handleLogin = async (e) => {
      e.preventDefault();
  
      try {
        const response = await axios.post("http://localhost:5000/api/login", {
          email,
          password,
        });
  
        // Save JWT token in localStorage
        localStorage.setItem("authToken", response.data.token);
  
        // Redirect to the post page
        // navigate("/PostOnFacebook");
        navigate("/Dashboard");
      } catch (error) {
        alert("Login failed: " + error.response.data.message);
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
          <button type="submit">Login</button>
        </form>
      </div>
    );
};

export default Login;
