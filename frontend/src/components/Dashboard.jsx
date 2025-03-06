// import React, { useState, useEffect } from "react";
// import { Button, Card, message } from "antd";
// import { FacebookOutlined, LogoutOutlined } from "@ant-design/icons";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";

// const Dashboard = () => {
//   const [loading, setLoading] = useState(false);
//   const [isConnected, setIsConnected] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Check if user is already connected to Facebook
//     axios.get("http://localhost:5000/facebook/status", { withCredentials: true })
//       .then(res => setIsConnected(res.data.connected))
//       .catch(() => setIsConnected(false));
//   }, []);

//   const handleFacebookLogin = () => {
//     setLoading(true);
//     window.location.href = "http://localhost:5000/auth/facebook";
//   };

//   const handleFacebookLogout = async () => {
//     setLoading(true);
//     try {
//       await axios.post("http://localhost:5000/facebook/logout", {}, { withCredentials: true });
//       setIsConnected(false);
//       message.success("Logged out from Facebook");
//     } catch (error) {
//       message.error("Failed to log out");
//     }
//     setLoading(false);
//   };

//   return (
//     <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
//       <Card title="Social Media Dashboard" style={{ width: 400, textAlign: "center" }}>
//         <p>Manage your Facebook posts easily</p>

//         {isConnected ? (
//           <>
//             <Button type="primary" icon={<FacebookOutlined />} block onClick={() => navigate("/facebook-post")}>
//               Go to Facebook Post Page
//             </Button>
//             <Button
//               type="default"
//               icon={<LogoutOutlined />}
//               danger
//               block
//               onClick={handleFacebookLogout}
//               style={{ marginTop: "10px" }}
//             >
//               Logout from Facebook
//             </Button>
//           </>
//         ) : (
//           <Button type="primary" icon={<FacebookOutlined />} block onClick={handleFacebookLogin} loading={loading}>
//             Connect to Facebook
//           </Button>
//         )}
//       </Card>
//     </div>
//   );
// };

// export default Dashboard;


import React from "react";
import { Layout, Menu, Card, Button, Row, Col } from "antd";
import "antd/dist/reset.css";
import { platforms } from "../components/constants/platforms";

const { Sider, Content } = Layout;


const Dashboard = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider style={{ background: "#001529" }}>
        <div className="logo" style={{ color: "white", textAlign: "center", padding: "16px", fontSize: "20px" }}>
          SocialPilot
        </div>
        <Menu theme="dark" mode="vertical" defaultSelectedKeys={["1"]}>
          <Menu.Item key="1">Dashboard</Menu.Item>
          <Menu.Item key="2">Posts</Menu.Item>
          <Menu.Item key="3">Accounts</Menu.Item>
          <Menu.Item key="4">Analytics</Menu.Item>
          <Menu.Item key="5">Inbox</Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Content style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Connect Account</h2>
            <Button type="primary">Create Post</Button>
          </div>
          <Row gutter={[16, 16]}>
            {platforms.map((platform) => (
              <Col span={8} key={platform.name}>
                <Card title={platform.name} extra={platform.icon} style={{ textAlign: "center" }}>
                  <Button type="link" onClick={platform.action ? platform.action : null}>{platform.connect}</Button>
                </Card>
              </Col>
            ))}
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;

