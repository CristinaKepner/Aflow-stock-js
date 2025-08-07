import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, Row, Col, Button, Select, message } from 'antd';
import MonacoEditor from '@monaco-editor/react';
import { PlayCircleOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';

const nodeTypes = {
  fetchKline: {
    label: 'Fetch Kline',
    color: '#1890ff',
    inputs: 0,
    outputs: 1,
  },
  technical: {
    label: 'Technical Analysis',
    color: '#52c41a',
    inputs: 1,
    outputs: 1,
  },
  news: {
    label: 'News Fetch',
    color: '#faad14',
    inputs: 0,
    outputs: 1,
  },
  sentiment: {
    label: 'Sentiment Analysis',
    color: '#eb2f96',
    inputs: 1,
    outputs: 1,
  },
  predict: {
    label: 'Predict Signal',
    color: '#722ed1',
    inputs: 2,
    outputs: 0,
  },
};

const CustomNode = ({ data, selected }) => (
  <div
    style={{
      padding: '10px',
      borderRadius: '8px',
      backgroundColor: data.color,
      color: 'white',
      border: selected ? '2px solid #1890ff' : '2px solid transparent',
      minWidth: '120px',
      textAlign: 'center',
    }}
  >
    {data.label}
  </div>
);

function WorkflowEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflowCode, setWorkflowCode] = useState(`async function workflow(ctx) {
  // Your workflow code here
  return ctx;
}`);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const addNode = useCallback((type) => {
    const newNode = {
      id: `${type}_${Date.now()}`,
      type: 'custom',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: nodeTypes[type].label,
        color: nodeTypes[type].color,
        type: type,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const generateWorkflowCode = useCallback(() => {
    const nodeMap = {};
    nodes.forEach(node => {
      nodeMap[node.id] = node;
    });

    let code = `async function generatedWorkflow(ctx) {\n`;
    
    // 添加数据获取节点
    const fetchNodes = nodes.filter(n => n.data.type === 'fetchKline');
    fetchNodes.forEach(node => {
      code += `  const { kline } = await StockOperators.FetchKline(ctx.symbol);\n`;
    });

    const newsNodes = nodes.filter(n => n.data.type === 'news');
    newsNodes.forEach(node => {
      code += `  const { news } = await StockOperators.FetchNews(ctx);\n`;
    });

    // 添加技术分析
    const techNodes = nodes.filter(n => n.data.type === 'technical');
    techNodes.forEach(node => {
      code += `  const { tech } = await StockOperators.TechnicalAnalysis({ ...ctx, kline });\n`;
    });

    // 添加情感分析
    const sentimentNodes = nodes.filter(n => n.data.type === 'sentiment');
    sentimentNodes.forEach(node => {
      code += `  const { sentiment } = await StockOperators.SentimentAnalysis({ ...ctx, news });\n`;
    });

    // 添加预测
    const predictNodes = nodes.filter(n => n.data.type === 'predict');
    predictNodes.forEach(node => {
      code += `  const { prediction } = await StockOperators.GeneratePrediction({ ...ctx, kline, tech, sentiment });\n`;
    });

    code += `  return { ...ctx, kline, tech, news, sentiment, prediction };\n`;
    code += `}`;

    setWorkflowCode(code);
  }, [nodes]);

  const runWorkflow = useCallback(async () => {
    try {
      message.info('Running workflow...');
      // 这里可以调用后端API运行workflow
      const response = await fetch('/api/workflow/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: workflowCode }),
      });
      
      if (response.ok) {
        const result = await response.json();
        message.success('Workflow executed successfully!');
        console.log('Workflow result:', result);
      } else {
        message.error('Failed to run workflow');
      }
    } catch (error) {
      message.error('Error running workflow: ' + error.message);
    }
  }, [workflowCode]);

  const saveWorkflow = useCallback(async () => {
    try {
      const workflowData = {
        nodes,
        edges,
        code: workflowCode,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch('/api/workflow/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData),
      });

      if (response.ok) {
        message.success('Workflow saved successfully!');
      } else {
        message.error('Failed to save workflow');
      }
    } catch (error) {
      message.error('Error saving workflow: ' + error.message);
    }
  }, [nodes, edges, workflowCode]);

  const nodeTypes = useMemo(() => ({
    custom: CustomNode,
  }), []);

  return (
    <div style={{ height: 'calc(100vh - 200px)' }}>
      <Row gutter={16} style={{ height: '100%' }}>
        <Col span={12}>
          <Card title="Workflow Designer" style={{ height: '100%' }}>
            <div style={{ marginBottom: 16 }}>
              <Select
                placeholder="Add node type"
                style={{ width: 200, marginRight: 8 }}
                onSelect={addNode}
              >
                {Object.keys(nodeTypes).map(type => (
                  <Select.Option key={type} value={type}>
                    {nodeTypes[type].label}
                  </Select.Option>
                ))}
              </Select>
              <Button 
                icon={<PlusOutlined />} 
                onClick={() => addNode('fetchKline')}
                style={{ marginRight: 8 }}
              >
                Add Node
              </Button>
              <Button 
                icon={<PlayCircleOutlined />} 
                onClick={runWorkflow}
                type="primary"
                style={{ marginRight: 8 }}
              >
                Run
              </Button>
              <Button 
                icon={<SaveOutlined />} 
                onClick={saveWorkflow}
              >
                Save
              </Button>
            </div>
            
            <div style={{ height: 'calc(100% - 80px)', border: '1px solid #d9d9d9' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
              >
                <Controls />
                <MiniMap />
                <Background variant="dots" gap={12} size={1} />
              </ReactFlow>
            </div>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Code Editor" style={{ height: '100%' }}>
            <div style={{ marginBottom: 16 }}>
              <Button onClick={generateWorkflowCode} style={{ marginRight: 8 }}>
                Generate Code
              </Button>
            </div>
            
            <div style={{ height: 'calc(100% - 80px)', border: '1px solid #d9d9d9' }}>
              <MonacoEditor
                height="100%"
                language="javascript"
                theme="vs-dark"
                value={workflowCode}
                onChange={setWorkflowCode}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default WorkflowEditor;
