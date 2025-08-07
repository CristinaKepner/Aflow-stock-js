import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Tag, Button, Select, InputNumber } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const { Option } = Select;

function TradingView() {
  const [positions, setPositions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [priceData, setPriceData] = useState([]);

  useEffect(() => {
    fetchTradingData();
    const interval = setInterval(fetchTradingData, 10000); // 10秒更新
    return () => clearInterval(interval);
  }, []);

  const fetchTradingData = async () => {
    try {
      const response = await fetch('/api/trading/status');
      if (response.ok) {
        const data = await response.json();
        if (data.positions) {
          const positionsList = Object.entries(data.positions).map(([symbol, pos]) => ({
            symbol,
            shares: pos.shares,
            avgPrice: pos.avgPrice,
            currentPrice: data.currentPrices[symbol] || 0,
            marketValue: pos.shares * (data.currentPrices[symbol] || 0),
            unrealizedPnL: pos.shares * ((data.currentPrices[symbol] || 0) - pos.avgPrice),
          }));
          setPositions(positionsList);
        }
      }
    } catch (error) {
      console.error('Failed to fetch trading data:', error);
    }
  };

  const positionColumns = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
    },
    {
      title: 'Shares',
      dataIndex: 'shares',
      key: 'shares',
    },
    {
      title: 'Avg Price',
      dataIndex: 'avgPrice',
      key: 'avgPrice',
      render: (price) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Current Price',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      render: (price) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Market Value',
      dataIndex: 'marketValue',
      key: 'marketValue',
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      title: 'Unrealized P&L',
      dataIndex: 'unrealizedPnL',
      key: 'unrealizedPnL',
      render: (pnl) => (
        <span style={{ color: pnl >= 0 ? '#52c41a' : '#ff4d4f' }}>
          ${pnl.toFixed(2)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Portfolio Positions">
            <Table
              columns={positionColumns}
              dataSource={positions}
              rowKey="symbol"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Price Chart">
            <Select
              value={selectedSymbol}
              onChange={setSelectedSymbol}
              style={{ width: 120, marginBottom: 16 }}
            >
              <Option value="AAPL">AAPL</Option>
              <Option value="TSLA">TSLA</Option>
              <Option value="GOOGL">GOOGL</Option>
              <Option value="MSFT">MSFT</Option>
            </Select>
            
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke="#1890ff" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Trading Actions">
            <div style={{ padding: '20px 0' }}>
              <div style={{ marginBottom: 16 }}>
                <label>Symbol:</label>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Select symbol"
                >
                  <Option value="AAPL">AAPL</Option>
                  <Option value="TSLA">TSLA</Option>
                  <Option value="GOOGL">GOOGL</Option>
                  <Option value="MSFT">MSFT</Option>
                </Select>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label>Shares:</label>
                <InputNumber
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Number of shares"
                  min={1}
                />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <Button type="primary" style={{ marginRight: 8 }}>
                  Buy
                </Button>
                <Button danger>
                  Sell
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default TradingView;
