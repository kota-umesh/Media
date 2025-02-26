import React, { useEffect, useState } from "react";
import { Layout, Card, Row, Col, Button, List, message, Spin } from "antd";
import { FacebookOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Header, Content } = Layout;

const Dashboard = () => {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState([]);
  const [fetchingPages, setFetchingPages] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("fbAccessToken", token);
      setAccessToken(token);
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      fetchFacebookPages();
    }
  }, [accessToken]);

  const fetchFacebookPages = async () => {
    setFetchingPages(true);
    try {
      const token = localStorage.getItem("fbAccessToken");
      if (!token) return;

      const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
      const response = await axios.get(`${backendUrl}/api/facebook/pages`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPages(response.data);
    } catch (error) {
      console.error("❌ Failed to fetch Facebook pages:", error);
      message.error("Failed to load Facebook pages.");
    } finally {
      setFetchingPages(false);
    }
  };

  const handleFacebookConnect = () => {
    setLoading(true);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
    window.location.href = `${backendUrl}/auth/facebook`;
  };

  const handleLogout = () => {
    localStorage.removeItem("fbAccessToken");
    setAccessToken("");
    setPages([]); // Clear pages on logout
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#1890ff", color: "white", textAlign: "center", fontSize: "20px" }}>
        Social Media Dashboard
      </Header>
      <Content style={{ padding: "40px" }}>
        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              title="Facebook"
              hoverable
              extra={<FacebookOutlined style={{ fontSize: "22px", color: "#4267B2" }} />}
              style={{ textAlign: "center" }}
            >
              <p>Manage Facebook Pages & Posts</p>
              {accessToken ? (
                <>
                  <Button type="primary" block onClick={() => navigate("/FacebookPost")}>
                    Manage Posts
                  </Button>
                  <Button type="danger" block onClick={handleLogout} style={{ marginTop: 10 }}>
                    Logout
                  </Button>
                </>
              ) : (
                <Button type="primary" block onClick={handleFacebookConnect} loading={loading}>
                  Connect Facebook
                </Button>
              )}
            </Card>
          </Col>
        </Row>

        {/* Facebook Pages List */}
        {accessToken && (
          <Row justify="center" style={{ marginTop: "20px" }}>
            <Col xs={24} sm={20} md={16} lg={12}>
              <Card title="Your Facebook Pages" style={{ textAlign: "center" }}>
                {fetchingPages ? (
                  <Spin tip="Loading pages..." fullscreen />
                ) : pages.length > 0 ? (
                  <List
                    bordered
                    dataSource={pages}
                    renderItem={(page) => (
                      <List.Item>
                        <strong>{page.name}</strong>
                        <Button type="primary" size="small" onClick={() => navigate(`/FacebookPost?pageId=${page.id}`)}>
                          Manage Posts
                        </Button>
                      </List.Item>
                    )}
                  />
                ) : (
                  <p>No pages found. Ensure you have granted the necessary permissions.</p>
                )}
              </Card>
            </Col>
          </Row>
        )}
      </Content>
    </Layout>
  );
};

export default Dashboard;
