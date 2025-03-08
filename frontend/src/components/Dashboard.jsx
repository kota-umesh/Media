
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

