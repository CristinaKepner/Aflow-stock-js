import React, { useState } from 'react';
import { Card, Form, Input, Button, Switch, InputNumber, Select, Divider } from 'antd';

const { Option } = Select;

function Settings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 这里可以保存设置到后端
      console.log('Settings:', values);
      // await saveSettings(values);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card title="System Settings">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            defaultSymbol: 'AAPL',
            maxRounds: 15,
            llmModel: 'gpt-4',
            llmTemperature: 0.7,
            cacheEnabled: true,
            cacheTTL: 3600,
          }}
        >
          <Divider orientation="left">Trading Settings</Divider>
          
          <Form.Item
            label="Default Symbol"
            name="defaultSymbol"
            rules={[{ required: true, message: 'Please input default symbol!' }]}
          >
            <Input placeholder="e.g., AAPL" />
          </Form.Item>

          <Form.Item
            label="Max Optimization Rounds"
            name="maxRounds"
            rules={[{ required: true, message: 'Please input max rounds!' }]}
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Divider orientation="left">LLM Settings</Divider>
          
          <Form.Item
            label="LLM Model"
            name="llmModel"
            rules={[{ required: true, message: 'Please select LLM model!' }]}
          >
            <Select>
              <Option value="gpt-4">GPT-4</Option>
              <Option value="gpt-3.5-turbo">GPT-3.5 Turbo</Option>
              <Option value="claude-3-sonnet">Claude-3 Sonnet</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Temperature"
            name="llmTemperature"
            rules={[{ required: true, message: 'Please input temperature!' }]}
          >
            <InputNumber
              min={0}
              max={2}
              step={0.1}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Divider orientation="left">Cache Settings</Divider>
          
          <Form.Item
            label="Enable Cache"
            name="cacheEnabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="Cache TTL (seconds)"
            name="cacheTTL"
            rules={[{ required: true, message: 'Please input cache TTL!' }]}
          >
            <InputNumber min={60} max={86400} style={{ width: '100%' }} />
          </Form.Item>

          <Divider orientation="left">Data Sources</Divider>
          
          <Form.Item
            label="Enable Yahoo Finance"
            name="yahooEnabled"
            valuePropName="checked"
          >
            <Switch defaultChecked />
          </Form.Item>

          <Form.Item
            label="Enable East Money"
            name="eastmoneyEnabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="Enable Sina Finance"
            name="sinaEnabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Save Settings
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default Settings;
