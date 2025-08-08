import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Progress } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined } from '@ant-design/icons';

function Dashboard() {
  const [stats, setStats] = useState({
    totalReturn: 0,
    winRate: 0,
    totalTrades: 0,
    activePositions: 0,
  });
  const [performanceData, setPerformanceData] = useState([]);
  const [recentTrades, setRecentTrades] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // 30秒更新一次
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setPerformanceData(data.performance);
        setRecentTrades(data.recentTrades);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const toggleTrading = async () => {
    try {
      const action = isRunning ? 'stop' : 'start';
      const response = await fetch(`/api/paper-trading/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'AAPL', initialCapital: 10000 })
      });
      
      if (response.ok) {
        setIsRunning(!isRunning);
      }
    } catch (error) {
      console.error('Failed to toggle trading:', error);
    }
  };

  const tradeColumns = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <span style={{ color: type === 'buy' ? '#52c41a' : '#ff4d4f' }}>
          {type.toUpperCase()}
        </span>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Shares',
      dataIndex: 'shares',
      key: 'shares',
    },
    {
      title: 'P&L',
      dataIndex: 'pnl',
      key: 'pnl',
      render: (pnl) => (
        <span style={{ color: pnl >= 0 ? '#52c41a' : '#ff4d4f' }}>
          ${pnl?.toFixed(2) || '0.00'}
        </span>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => new Date(timestamp).toLocaleTimeString(),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Return"
              value={stats.totalReturn}
              precision={2}
              valueStyle={{ color: stats.totalReturn >= 0 ? '#3f8600' : '#cf1322' }}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Win Rate"
              value={stats.winRate}
              precision={1}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Trades"
              value={stats.totalTrades}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Positions"
              value={stats.activePositions}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card title="Performance Chart">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#1890ff" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Trading Status">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Progress
                type="circle"
                percent={stats.winRate}
                format={(percent) => `${percent}%`}
                strokeColor={stats.winRate >= 60 ? '#52c41a' : '#faad14'}
              />
              <div style={{ marginTop: 16 }}>
                <Button
                  type={isRunning ? 'default' : 'primary'}
                  icon={isRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={toggleTrading}
                  style={{ marginRight: 8 }}
                >
                  {isRunning ? 'Stop Trading' : 'Start Trading'}
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchDashboardData}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col span={24}>
          <Card title="Recent Trades">
            <Table
              columns={tradeColumns}
              dataSource={recentTrades}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
