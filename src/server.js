import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';
import { Optimizer } from './search/optimizer.js';
import { MultiSymbolOptimizer } from './search/multiSymbolOptimizer.js';
import { PaperTrading } from './trading/paperTrading.js';
import { StockOperators } from './operators/stockOperators.js';
import { backtestEval } from './eval/backtestEval.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '../frontend/dist')));

let paperTrading = null;
let currentWorkflow = null;

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = {
      totalReturn: 0,
      winRate: 0,
      totalTrades: 0,
      activePositions: 0,
    };

    if (paperTrading) {
      const performance = paperTrading.getPerformanceStats();
      stats.totalReturn = performance.totalReturn;
      stats.winRate = performance.winRate;
      stats.totalTrades = performance.totalTrades;
      stats.activePositions = paperTrading.positions.size;
    }

    const performanceData = [
      { date: '2024-01-01', value: 100 },
      { date: '2024-01-02', value: 102 },
      { date: '2024-01-03', value: 98 },
      { date: '2024-01-04', value: 105 },
      { date: '2024-01-05', value: 103 },
    ];

    const recentTrades = paperTrading ? paperTrading.trades.slice(-10) : [];

    res.json({ stats, performance: performanceData, recentTrades });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/workflow/run', async (req, res) => {
  try {
    const { code, symbol = 'AAPL' } = req.body;
    
    const workflowFunction = new Function('StockOperators', `
      ${code}
      return generatedWorkflow || workflow || async function(ctx) { return ctx; };
    `)(StockOperators);

    const result = await workflowFunction({ symbol });
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/workflow/save', async (req, res) => {
  try {
    const workflowData = req.body;
    const filename = `storage/workflow_${Date.now()}.json`;
    
    await fs.writeJson(filename, workflowData, { spaces: 2 });
    
    res.json({ success: true, filename });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/workflow/list', async (req, res) => {
  try {
    const storageDir = 'storage';
    const files = await fs.readdir(storageDir);
    const workflowFiles = files.filter(file => file.startsWith('workflow_'));
    
    const workflows = [];
    for (const file of workflowFiles) {
      const content = await fs.readJson(join(storageDir, file));
      workflows.push({
        name: file,
        timestamp: content.timestamp || new Date().toISOString(),
        symbol: content.symbol || 'Unknown'
      });
    }
    
    res.json({ workflows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/paper-trading/start', async (req, res) => {
  try {
    const { symbol = 'AAPL', initialCapital = 10000 } = req.body;
    
    if (paperTrading) {
      paperTrading.stop();
    }
    
    paperTrading = new PaperTrading(symbol, initialCapital);
    await paperTrading.start();
    
    res.json({ success: true, message: 'Paper trading started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/paper-trading/stop', async (req, res) => {
  try {
    if (paperTrading) {
      paperTrading.stop();
      paperTrading = null;
    }
    
    res.json({ success: true, message: 'Paper trading stopped' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/paper-trading/status', async (req, res) => {
  try {
    if (!paperTrading) {
      res.json({ running: false });
      return;
    }
    
    const stats = paperTrading.getPerformanceStats();
    const positions = Array.from(paperTrading.positions.values());
    
    res.json({
      running: true,
      stats,
      positions,
      trades: paperTrading.trades.slice(-20)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/optimization/single', async (req, res) => {
  try {
    const { symbol = 'AAPL', maxRounds = 5 } = req.body;
    
    const optimizer = new Optimizer({
      operators: StockOperators,
      evaluator: backtestEval,
      symbol,
      maxRounds
    });
    
    const result = await optimizer.run();
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/optimization/multi-symbol', async (req, res) => {
  try {
    const { symbols = ['AAPL', 'GOOGL', 'MSFT'], maxConcurrent = 3 } = req.body;
    
    const optimizer = new MultiSymbolOptimizer({
      operators: StockOperators,
      evaluator: backtestEval,
      symbols,
      maxConcurrent
    });
    
    const result = await optimizer.run();
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/data/kline/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '1mo' } = req.query;
    
    const { fetchKline } = await import('./nodes/fetchKline.js');
    const kline = await fetchKline(symbol, period);
    
    res.json({ success: true, data: kline });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/data/news/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const { fetchNews } = await import('./nodes/news.js');
    const news = await fetchNews(symbol);
    
    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/data/technical/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const { fetchKline } = await import('./nodes/fetchKline.js');
    const { technical } = await import('./nodes/technical.js');
    
    const kline = await fetchKline(symbol);
    const tech = await technical(kline);
    
    res.json({ success: true, data: tech });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
});
