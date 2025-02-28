import React, { useEffect, useState } from "react";
import { Button, Input, Card, Avatar, message, Spin } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const { TextArea } = Input;

const PostPage = () => {
  const navigate = useNavigate();
  const { pageId } = useParams();
  const [postContent, setPostContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageDetails, setPageDetails] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5000/facebook/pages", { withCredentials: true })
      .then((res) => {
        const page = res.data.pages.find((p) => p.id === pageId);
        if (page) {
          setPageDetails(page);
        } else {
          message.error("Page not found!");
          navigate("/dashboard");
        }
      })
      .catch((err) => {
        console.error("Error fetching page details:", err);
        message.error("Failed to load page details.");
        navigate("/dashboard");
      });
  }, [pageId, navigate]);

  const handlePost = () => {
    if (!postContent.trim()) {
      message.error("Post content cannot be empty!");
      return;
    }
  
    setLoading(true);
  
    axios
      .post(
        "http://localhost:5000/facebook/post",
        { pageId: pageDetails.id, message: postContent },  // Ensure correct data is sent
        { withCredentials: true }
      )
      .then((res) => {
        message.success(res.data.message || "Post published successfully!");
        setPostContent(""); // Clear input field
      })
      .catch((err) => {
        console.error("Error posting:", err);
        message.error(err.response?.data?.error || "Failed to publish post.");
      })
      .finally(() => setLoading(false));
  };
  

  if (!pageDetails) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "500px", margin: "40px auto", textAlign: "center" }}>
      <Button onClick={() => navigate("/dashboard")} style={{ marginBottom: "20px" }}>
        Back to Dashboard
      </Button>

      <Card title="Create a Facebook Post">
        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
          <Avatar src={pageDetails.profilePicture} size={50} />
          <h3 style={{ marginLeft: "10px" }}>{pageDetails.name}</h3>
        </div>

        <TextArea
          rows={4}
          placeholder="What's on your mind?"
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
        />
        <Button type="primary" onClick={handlePost} loading={loading} style={{ marginTop: "10px" }}>
          Post to Facebook
        </Button>
      </Card>
    </div>
  );
};

export default PostPage;
