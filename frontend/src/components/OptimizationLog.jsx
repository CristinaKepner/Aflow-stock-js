import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Select, Typography, Progress, Tag, Space, Divider, Table, Collapse, Input } from 'antd';
import { PlayCircleOutlined, StopOutlined, ReloadOutlined, ClearOutlined, RocketOutlined, BarChartOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

function OptimizationLog() {
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSymbol, setCurrentSymbol] = useState('AAPL');
  const [multiSymbols, setMultiSymbols] = useState(['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN']);
  const [optimizationMode, setOptimizationMode] = useState('single');
  const [optimizationStats, setOptimizationStats] = useState({
    round: 0,
    maxRounds: 5,
    bestScore: 0,
    currentScore: 0
  });
  const [optimizationResults, setOptimizationResults] = useState([]);
  const [finalWorkflow, setFinalWorkflow] = useState('');
  const [multiResults, setMultiResults] = useState(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type, id: Date.now() }]);
  };

  const runRealOptimization = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setProgress(0);
    setOptimizationStats({ round: 0, maxRounds: 3, bestScore: 0, currentScore: 0 });
    setOptimizationResults([]);
    setFinalWorkflow('');
    setMultiResults(null);
    
    const apiEndpoint = optimizationMode === 'single' ? '/api/optimization/real' : '/api/optimization/multi';
    const requestBody = optimizationMode === 'single' 
      ? { symbol: currentSymbol, maxRounds: 3 }
      : { symbols: multiSymbols, maxConcurrent: 3 };
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              handleOptimizationUpdate(data);
            } catch (e) {
              if (line.trim()) {
                addLog(line, 'info');
              }
            }
          }
        }
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  };

  const runSimpleOptimization = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setProgress(0);
    setOptimizationStats({ round: 0, maxRounds: 5, bestScore: 0, currentScore: 0 });
    addLog(`🚀 Starting AFlow optimization for ${currentSymbol}`, 'success');
    addLog(`📊 Max rounds: 5`, 'info');

    // 模拟优化过程
    for (let round = 1; round <= 5; round++) {
      if (!isRunning) break;
      
      addLog(`\n🔄 Round ${round}/5`, 'info');
      setOptimizationStats(prev => ({ ...prev, round }));
      setProgress((round - 1) * 20);
      
      // 模拟MCTS搜索
      addLog('🔍 MCTS search in progress...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const searchScore = Math.random() * 0.8;
      addLog(`🔍 MCTS search completed. Best score: ${searchScore.toFixed(3)}`, 'success');
      
      // 模拟工作流生成
      addLog('🤖 Generating improved workflow...', 'info');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟回测
      addLog(`=== Starting Backtest for ${currentSymbol} ===`, 'info');
      addLog('Testing period: 30 days', 'info');
      addLog(`Fetching kline data for ${currentSymbol}...`, 'info');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const winRate = 45 + Math.random() * 20;
      const totalReturn = (Math.random() - 0.5) * 10;
      const totalTrades = Math.floor(Math.random() * 30) + 10;
      
      addLog(`Win Rate: ${winRate.toFixed(2)}%`, winRate > 55 ? 'success' : 'warning');
      addLog(`Total Return: ${totalReturn.toFixed(2)}%`, totalReturn > 0 ? 'success' : 'error');
      addLog(`Total Trades: ${totalTrades}`, 'info');
      
      const improvement = (winRate / 100) - optimizationStats.bestScore;
      if (improvement > 0) {
        addLog(`✅ Improvement accepted: +${(improvement * 100).toFixed(2)}%`, 'success');
        setOptimizationStats(prev => ({ 
          ...prev, 
          bestScore: winRate / 100, 
          currentScore: winRate / 100 
        }));
      } else {
        addLog(`❌ Improvement rejected: ${(improvement * 100).toFixed(2)}%`, 'warning');
      }
      
      addLog(`Round ${round} result: ${winRate.toFixed(2)}% (best: ${(optimizationStats.bestScore * 100).toFixed(2)}%)`, 'info');
      
      setProgress(round * 20);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setIsRunning(false);
    setProgress(100);
    addLog('💾 Results saved to storage/optimization_results.json', 'info');
    addLog('✅ Optimization completed successfully!', 'success');
    
    // 显示最终结果
    addLog('\n🎉 Optimization Results', 'success');
    addLog('======================', 'success');
    addLog(`Symbol: ${currentSymbol}`, 'info');
    addLog(`Best Score: ${(optimizationStats.bestScore * 100).toFixed(2)}%`, 'success');
    addLog(`Rounds Completed: 5`, 'info');
  };

  const stopOptimization = () => {
    setIsRunning(false);
    addLog('🛑 Optimization stopped by user', 'warning');
  };

  const clearLogs = () => {
    setLogs([]);
    setProgress(0);
    setOptimizationStats({ round: 0, maxRounds: 5, bestScore: 0, currentScore: 0 });
  };

  const handleOptimizationUpdate = (data) => {
    if (data.type === 'round') {
      setOptimizationStats(prev => ({ ...prev, round: data.round, maxRounds: data.maxRounds }));
      setProgress((data.round - 1) / data.maxRounds * 100);
    } else if (data.type === 'score') {
      setOptimizationStats(prev => ({ 
        ...prev, 
        currentScore: data.score,
        bestScore: Math.max(prev.bestScore, data.score)
      }));
    } else if (data.type === 'log') {
      addLog(data.message, data.level || 'info');
    } else if (data.type === 'final_result') {
      setFinalWorkflow(data.workflow);
      setOptimizationResults([{
        symbol: data.symbol,
        score: data.score,
        workflow: data.workflow,
        timestamp: data.timestamp
      }]);
    } else if (data.type === 'multi_result') {
      setMultiResults(data);
      const results = data.results.map((result, index) => ({
        key: index,
        symbol: result.status === 'fulfilled' ? result.value.symbol : 'Error',
        score: result.status === 'fulfilled' ? result.value.score : 0,
        status: result.status,
        workflow: result.status === 'fulfilled' ? result.value.workflow : 'Failed'
      }));
      setOptimizationResults(results);
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return '#52c41a';
      case 'error': return '#ff4d4f';
      case 'warning': return '#faad14';
      default: return '#1890ff';
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const resultsColumns = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (text, record) => (
        <Tag color={record.status === 'fulfilled' ? 'green' : 'red'}>
          {text}
        </Tag>
      )
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      render: (score) => (
        <span style={{ color: score > 0.5 ? '#52c41a' : '#ff4d4f' }}>
          {(score * 100).toFixed(2)}%
        </span>
      ),
      sorter: (a, b) => a.score - b.score
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'fulfilled' ? 'success' : 'error'}>
          {status === 'fulfilled' ? 'Success' : 'Failed'}
        </Tag>
      )
    }
  ];

  return (
    <div>
      <Card title="AFlow Optimization Console" style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Select 
            value={optimizationMode}
            onChange={setOptimizationMode}
            style={{ width: 150 }}
            disabled={isRunning}
          >
            <Option value="single">Single Symbol</Option>
            <Option value="multi">Multi-Symbol</Option>
          </Select>
          
          {optimizationMode === 'single' ? (
            <Select 
              value={currentSymbol} 
              onChange={setCurrentSymbol}
              style={{ width: 120 }}
              disabled={isRunning}
            >
              <Option value="AAPL">AAPL</Option>
              <Option value="GOOGL">GOOGL</Option>
              <Option value="MSFT">MSFT</Option>
              <Option value="TSLA">TSLA</Option>
              <Option value="AMZN">AMZN</Option>
            </Select>
          ) : (
            <Input 
              value={multiSymbols.join(', ')}
              onChange={(e) => setMultiSymbols(e.target.value.split(',').map(s => s.trim()))}
              placeholder="AAPL, GOOGL, MSFT, TSLA, AMZN"
              style={{ width: 300 }}
              disabled={isRunning}
            />
          )}
          
          <Button 
            type="primary" 
            icon={<RocketOutlined />}
            onClick={runRealOptimization}
            disabled={isRunning}
          >
            Start Real Optimization
          </Button>
          
          <Button 
            icon={<PlayCircleOutlined />}
            onClick={runSimpleOptimization}
            disabled={isRunning}
          >
            Demo Mode
          </Button>
          
          <Button 
            icon={<StopOutlined />}
            onClick={stopOptimization}
            disabled={!isRunning}
          >
            Stop
          </Button>
          
          <Button 
            icon={<ClearOutlined />}
            onClick={clearLogs}
            disabled={isRunning}
          >
            Clear
          </Button>
        </Space>

        <Space style={{ marginBottom: 16 }}>
          <Tag color="blue">Mode: {optimizationMode === 'single' ? 'Single Symbol' : 'Multi-Symbol'}</Tag>
          <Tag color="purple">Round: {optimizationStats.round}/{optimizationStats.maxRounds}</Tag>
          <Tag color="green">Best: {(optimizationStats.bestScore * 100).toFixed(2)}%</Tag>
          <Tag color="orange">Current: {(optimizationStats.currentScore * 100).toFixed(2)}%</Tag>
        </Space>

        <Progress 
          percent={progress} 
          status={isRunning ? 'active' : 'normal'}
          style={{ marginBottom: 16 }}
        />
      </Card>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <Card title="Real-time Logs" style={{ flex: 2 }} bodyStyle={{ height: 400, overflow: 'auto', backgroundColor: '#001529', padding: 16 }}>
          {logs.map((log) => (
            <div key={log.id} style={{ marginBottom: 4, fontFamily: 'monospace', fontSize: 12 }}>
              <Text style={{ color: '#666' }}>[{log.timestamp}]</Text>
              <Text style={{ color: getLogColor(log.type), marginLeft: 8 }}>
                {getLogIcon(log.type)} {log.message}
              </Text>
            </div>
          ))}
          <div ref={logsEndRef} />
        </Card>

        {optimizationResults.length > 0 && (
          <Card title="Optimization Results" style={{ flex: 1 }}>
            <Table 
              columns={resultsColumns}
              dataSource={optimizationResults}
              pagination={false}
              size="small"
            />
            {multiResults && (
              <div style={{ marginTop: 16 }}>
                <Tag color="blue">Total Time: {multiResults.totalTime}ms</Tag>
                <Tag color="green">Avg Score: {(multiResults.averageScore * 100).toFixed(2)}%</Tag>
                <Tag color="gold">Best: {multiResults.globalBestSymbol}</Tag>
              </div>
            )}
          </Card>
        )}
      </div>

      {finalWorkflow && (
        <Collapse style={{ marginBottom: 16 }}>
          <Panel header="Best Workflow Code" key="workflow">
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: 16, 
              borderRadius: 4, 
              fontFamily: 'monospace',
              fontSize: 12,
              maxHeight: 300,
              overflow: 'auto'
            }}>
              <pre>{finalWorkflow}</pre>
            </div>
          </Panel>
        </Collapse>
      )}
    </div>
  );
}

export default OptimizationLog;
