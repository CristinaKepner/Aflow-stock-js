import { fetchKline } from '../nodes/fetchKline.js';
import { writeFileSync } from 'fs';

export async function backtestEval(workflow, symbol = 'AAPL', days = 30) {
  console.log(`\n=== Starting Backtest for ${symbol} ===`);
  console.log(`Testing period: ${days} days`);
  
  const kline = await fetchKline(symbol, `${days + 30}d`);
  if (!kline || kline.length === 0) {
    console.log('No kline data available for backtest');
    return 0;
  }

  let wins = 0;
  let total = 0;
  let totalReturn = 0;
  const returns = [];

  for (let i = 30; i < Math.min(kline.length - 1, 30 + days); i++) {
    const currentDate = kline[i].date;
    const nextDate = kline[i + 1].date;
    const currentPrice = kline[i].close;
    const nextPrice = kline[i + 1].close;
    const actualReturn = (nextPrice - currentPrice) / currentPrice;

    try {
      const ctx = { symbol, dateIdx: i, kline };
      let prediction;
      
      if (typeof workflow === 'string') {
        prediction = await executeWorkflow(workflow, ctx);
      } else {
        prediction = await workflow(ctx);
      }

      if (prediction && prediction.signal) {
        const signal = prediction.signal.toLowerCase();
        const confidence = prediction.confidence || 0.5;
        
        let expectedReturn = 0;
        if (signal === 'buy') expectedReturn = 0.01;
        else if (signal === 'sell') expectedReturn = -0.01;
        
        const isWin = (signal === 'buy' && actualReturn > 0) || 
                     (signal === 'sell' && actualReturn < 0) ||
                     (signal === 'hold' && Math.abs(actualReturn) < 0.005);
        
        if (isWin) wins++;
        total++;
        
        const tradeReturn = signal === 'buy' ? actualReturn : 
                           signal === 'sell' ? -actualReturn : 0;
        totalReturn += tradeReturn;
        returns.push(tradeReturn);
        
        const direction = actualReturn > 0 ? 'UP' : 'DOWN';
        const result = isWin ? '✓' : '✗';
        console.log(`${currentDate}: ${signal.toUpperCase()} (${confidence.toFixed(1)}) -> ${direction} ${(Math.abs(actualReturn) * 100).toFixed(2)}% [${result}]`);
      } else {
        console.log(`No prediction for ${currentDate}, skipping...`);
      }
    } catch (error) {
      console.log(`Workflow execution error: ${error.message}`);
    }
  }

  const winRate = total > 0 ? wins / total : 0;
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const sharpeRatio = returns.length > 1 ? avgReturn / Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / (returns.length - 1)) : 0;

  console.log('\n=== Backtest Results ===');
  console.log(`Symbol: ${symbol}`);
  console.log(`Total Trades: ${total}`);
  console.log(`Win Rate: ${(winRate * 100).toFixed(2)}%`);
  console.log(`Total Return: ${(totalReturn * 100).toFixed(2)}%`);
  console.log(`Avg Return: ${(avgReturn * 100).toFixed(2)}%`);
  console.log(`Sharpe Ratio: ${sharpeRatio.toFixed(3)}`);

  return winRate;
}

async function executeWorkflow(workflowName, ctx) {
  const operators = {
    LightAnalysis: async (ctx) => {
      const { kline } = await fetchKline(ctx.symbol);
      const tech = await calculateTechnical(kline);
      const prediction = await generatePrediction({ ...ctx, kline, tech });
      return prediction;
    },
    FullAnalysis: async (ctx) => {
      const { kline } = await fetchKline(ctx.symbol);
      const tech = await calculateTechnical(kline);
      const news = await fetchNews(ctx.symbol);
      const sentiment = await analyzeSentiment(news);
      const prediction = await generatePrediction({ ...ctx, kline, tech, sentiment, news });
      return prediction;
    }
  };

  const workflow = operators[workflowName];
  if (workflow) {
    return await workflow(ctx);
  }
  
  return null;
}

async function calculateTechnical(kline) {
  if (!kline || kline.length === 0) return {};
  
  const close = kline.map(c => c.close);
  const latest = close[close.length - 1];
  
  return {
    rsi: { value: 50 + Math.random() * 20 },
    macd: { MACD: (Math.random() - 0.5) * 2 },
    bb: { upper: latest * 1.02, lower: latest * 0.98 }
  };
}

async function fetchNews(symbol) {
  return `Mock news for ${symbol}: Market analysis shows positive trends.`;
}

async function analyzeSentiment(news) {
  return {
    overall_sentiment: 'positive',
    sentiment_score: 0.6 + Math.random() * 0.3
  };
}

async function generatePrediction(ctx) {
  const signals = ['buy', 'sell', 'hold'];
  const signal = signals[Math.floor(Math.random() * signals.length)];
  
  return {
    signal,
    confidence: 0.5 + Math.random() * 0.4,
    reasoning: 'Mock prediction based on technical analysis'
  };
}
