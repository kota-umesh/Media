import axios from "axios";
import { message } from "antd";

const backendURL = process.env.REACT_APP_BACKEND_URL || "https://media-6zl6.onrender.com";

export const connectFacebook = async () => {
  try {
    const response = await axios.get(`${backendURL}/facebook/auth-url`, { withCredentials: true });
    if (response.data.url) {
      window.location.href = response.data.url;
    }// Redirect to Facebook login
  } catch (error) {
    message.error("Failed to connect to Facebook");
  }
};
