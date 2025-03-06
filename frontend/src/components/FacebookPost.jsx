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

  const backendURL = process.env.BACKEND_URL || "https://media-6zl6.onrender.com";

  useEffect(() => {
    axios.get(`${backendURL}/facebook/pages`, { withCredentials: true })
      .then(res => {
        console.log("Facebook Pages:", res.data);
        setPages(res.data.pages || []);
      })
      .catch(() => message.error("Failed to fetch pages"));
  }, [backendURL]);

  const handleUpload = ({ fileList }) => {
    const validFiles = fileList.filter(file => file.type.startsWith("image/") || file.type.startsWith("video/"));
  
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
  
    setLoading(true);
    const formData = new FormData();
    formData.append("pageId", selectedPage);
    formData.append("message", postMessage.trim()); // Trim to avoid empty spaces
  
    // Append media files
    mediaFiles.forEach((file, index) => {
      //console.log(`📂 Appending file ${index + 1}:`, file);
      formData.append("media", file.originFileObj); 
    });
  
    // Debugging FormData
    console.log("🔹 Sending FormData:");
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]); // ✅ Log FormData key-value pairs
    }
  
    try {
      const response = await axios.post(`${backendURL}/facebook/post`, formData, {
        withCredentials: true, 
        headers: { "Content-Type": "multipart/form-data" },
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
  
  

  const handleLogout = async () => {
    setLoading(true);
    try {
      await axios.post(`${backendURL}/facebook/logout`, {}, { withCredentials: true });
      message.success("Logged out from Facebook");
      navigate("/dashboard");
    } catch (error) {
      console.error("Logout error:", error);
      message.error(error.response?.data?.message || "Failed to log out");
    }
    setLoading(false);
  };

  const validPages = pages.filter(page => page.id != null && page.name != null);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Spin spinning={loading}>
        <Card title="Post to Facebook" style={{ width: 400, textAlign: "center" }}>
          <Select
            placeholder="Select Facebook Page"
            style={{ width: "100%", marginBottom: "10px" }}
            onChange={(value) => setSelectedPage(value)}
            value={selectedPage}
          >
            {validPages.length > 0 ? (
              validPages.map((page) => (
                <Option key={page.id} value={page.id}>{page.name}</Option>
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

          <Upload
            multiple
            beforeUpload={() => false}
            onChange={handleUpload}
            fileList={mediaFiles}
            showUploadList
          >
            <Button icon={<UploadOutlined />}>Upload Images/Videos</Button>
          </Upload>

          <Button
            type="primary"
            icon={<FacebookOutlined />}
            block
            onClick={handlePost}
            style={{ marginTop: "10px" }}
          >
            Post to Facebook
          </Button>

          <Button
            type="default"
            icon={<LogoutOutlined />}
            danger
            block
            onClick={handleLogout}
            style={{ marginTop: "10px" }}
          >
            Logout from Facebook
          </Button>
        </Card>
      </Spin>
    </div>
  );
};

export default FacebookPost;

