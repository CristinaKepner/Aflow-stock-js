import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  CodeOutlined,
  LineChartOutlined,
  SettingOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import WorkflowEditor from './components/WorkflowEditor';
import Dashboard from './components/Dashboard';
import TradingView from './components/TradingView';
import Settings from './components/Settings';
import OptimizationLog from './components/OptimizationLog';
import './App.css';

const { Header, Sider, Content } = Layout;

function App() {
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'optimization',
      icon: <RocketOutlined />,
      label: 'AFlow Optimization',
    },
    {
      key: 'workflow',
      icon: <CodeOutlined />,
      label: 'Workflow Editor',
    },
    {
      key: 'trading',
      icon: <LineChartOutlined />,
      label: 'Trading View',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case 'dashboard':
        return <Dashboard />;
      case 'optimization':
        return <OptimizationLog />;
      case 'workflow':
        return <WorkflowEditor />;
      case 'trading':
        return <TradingView />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{
          background: colorBgContainer,
        }}
      >
        <div className="demo-logo-vertical" />
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => setSelectedKey(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
          }}
        >
          <h1 style={{ margin: '0 24px', color: '#1890ff' }}>
            AFlow Stock Trading System
          </h1>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
