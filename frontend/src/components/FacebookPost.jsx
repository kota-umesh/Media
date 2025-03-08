import React, { useState, useEffect } from "react";
import { Card, Select, Input, Upload, Button, message, Spin } from "antd";
import { UploadOutlined, FacebookOutlined, LogoutOutlined } from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const { TextArea } = Input;
const { Option } = Select;

const FacebookPost = () => {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState("");
  const [postMessage, setPostMessage] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // const [isTokenSet, setIsTokenSet] = useState(false);
  const backendURL = process.env.REACT_APP_BACKEND_URL || "https://media-6zl6.onrender.com";
  const [fbToken, setFbToken] = useState(null);

  useEffect(() => {
    let urlParams = new URLSearchParams(window.location.search);
    let tokenFromUrl = urlParams.get("token");

    if (tokenFromUrl) {
      console.log("📌 FacebookPost Loaded. URL Token:", tokenFromUrl);
      localStorage.setItem("fbToken", tokenFromUrl);
      setFbToken(tokenFromUrl);

      // Use a small delay before navigating to avoid losing the token
      setTimeout(() => {
        console.log("🔄 Navigating to clean URL...");
        navigate("/facebook-post", { replace: true });
      }, 500);
    } else {
      // Try to get token from localStorage if it's not in the URL
      let tokenFromStorage = localStorage.getItem("fbToken");
      console.log("📌 FacebookPost Loaded. LocalStorage Token:", tokenFromStorage);

      if (tokenFromStorage) {
        setFbToken(tokenFromStorage);
      } else {
        console.log("⚠️ No token found in URL or localStorage.");
      }
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("fbToken");
    if (!token) {
      message.error("Authentication failed. Please log in again.");
      navigate("/dashboard");
      return;
    }

    axios
      .get(`${backendURL}/facebook/pages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("Facebook Pages:", res.data);
        setPages(res.data.pages || []);
      })
      .catch(() => message.error("Failed to fetch pages"));
  }, [backendURL, navigate]);

  const handleUpload = ({ fileList }) => {
    const validFiles = fileList.filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    if (validFiles.length > 5) {
      message.error("You can upload a maximum of 5 files.");
      return;
    }

    setMediaFiles(validFiles);
  };

  const handlePost = async () => {
    if (!selectedPage) {
      message.error("Please select a page");
      return;
    }

    if (!postMessage.trim() && mediaFiles.length === 0) {
      message.error("Please enter a message or upload media");
      return;
    }

    const token = localStorage.getItem("fbToken");
    if (!token) {
      message.error("Authentication expired. Please log in again.");
      navigate("/dashboard");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("pageId", selectedPage);
    formData.append("message", postMessage.trim());

    // Append media files
    mediaFiles.forEach((file) => {
      formData.append("media", file.originFileObj);
    });

    try {
      const response = await axios.post(`${backendURL}/facebook/post`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ Response:", response.data);
      message.success("Posted successfully!");

      // Reset form fields
      setPostMessage("");
      setMediaFiles([]);
    } catch (error) {
      console.error("❌ Posting error:", error.response?.data || error.message);
      message.error(error.response?.data?.error || "Failed to post");
    }

    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("fbToken");
    message.success("Logged out successfully");
    navigate("/dashboard");
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Spin spinning={loading}>
        <Card title="Post to Facebook" style={{ width: 400, textAlign: "center" }}>
          <Select
            placeholder="Select Facebook Page"
            style={{ width: "100%", marginBottom: "10px" }}
            onChange={(value) => setSelectedPage(value)}
            value={selectedPage || null}
          >
            {pages.length > 0 ? (
              pages.map((page) => (
                <Option key={page.id} value={page.id}>
                  {page.name}
                </Option>
              ))
            ) : (
              <Option disabled>No pages available</Option>
            )}
          </Select>

          <TextArea
            placeholder="Enter your post message"
            rows={4}
            value={postMessage}
            onChange={(e) => setPostMessage(e.target.value)}
            style={{ marginBottom: "10px" }}
          />

          <Upload multiple beforeUpload={() => false} onChange={handleUpload} fileList={mediaFiles} showUploadList>
            <Button icon={<UploadOutlined />}>Upload Images/Videos</Button>
          </Upload>

          <Button type="primary" icon={<FacebookOutlined />} block onClick={handlePost} style={{ marginTop: "10px" }}>
            Post to Facebook
          </Button>

          <Button type="default" icon={<LogoutOutlined />} danger block onClick={handleLogout} style={{ marginTop: "10px" }}>
            Logout from Facebook
          </Button>
        </Card>
      </Spin>
    </div>
  );
};

export default FacebookPost;
