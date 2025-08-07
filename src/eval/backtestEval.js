import fs from 'fs-extra';
import { fetchKline } from '../nodes/fetchKline.js';

export async function backtestEval(workflow, symbol = 'AAPL', days = 60) {
  try {
    console.log(`\n=== Starting Backtest for ${symbol} ===`);
    console.log(`Testing period: ${days} days`);
    
    // 获取历史数据
    const kline = await fetchKline(symbol, '1y');
    if (kline.length < days + 30) {
      throw new Error(`Insufficient historical data: ${kline.length} days available, need ${days + 30}`);
    }

    let winCount = 0;
    let totalTrades = 0;
    let totalReturn = 0;
    const trades = [];

    // 从第30天开始回测，确保有足够的历史数据计算技术指标
    for (let i = 30; i < Math.min(days + 30, kline.length - 1); i++) {
      const currentDate = kline[i].date;
      const nextDate = kline[i + 1].date;
      const currentPrice = kline[i].close;
      const nextPrice = kline[i + 1].close;
      
      // 准备上下文数据
      const ctx = {
        symbol,
        date: currentDate,
        dateIdx: i,
        period: '1y'
      };

      try {
        // 执行workflow
        const result = await workflow(ctx);
        
        if (!result || !result.prediction) {
          console.warn(`No prediction for ${currentDate}, skipping...`);
          continue;
        }

        const prediction = result.prediction;
        const actualReturn = (nextPrice - currentPrice) / currentPrice;
        
        // 判断预测是否正确
        let isCorrect = false;
        let tradeReturn = 0;
        
        if (prediction.signal === 'buy' && actualReturn > 0) {
          isCorrect = true;
          tradeReturn = actualReturn;
        } else if (prediction.signal === 'sell' && actualReturn < 0) {
          isCorrect = true;
          tradeReturn = -actualReturn; // 做空收益
        } else if (prediction.signal === 'hold') {
          // 持有不产生收益
          tradeReturn = 0;
        } else {
          // 预测错误
          tradeReturn = prediction.signal === 'buy' ? -Math.abs(actualReturn) : -Math.abs(actualReturn);
        }

        if (prediction.signal !== 'hold') {
          winCount += isCorrect ? 1 : 0;
          totalTrades++;
          totalReturn += tradeReturn;
        }

        trades.push({
          date: currentDate,
          nextDate,
          currentPrice,
          nextPrice,
          actualReturn: (actualReturn * 100).toFixed(2) + '%',
          prediction: prediction.signal,
          confidence: prediction.confidence,
          isCorrect,
          tradeReturn: (tradeReturn * 100).toFixed(2) + '%',
          reasoning: prediction.reasoning?.substring(0, 100) + '...'
        });

        console.log(`${currentDate}: ${prediction.signal.toUpperCase()} (${prediction.confidence}) -> ${actualReturn > 0 ? 'UP' : 'DOWN'} ${(actualReturn * 100).toFixed(2)}% [${isCorrect ? '✓' : '✗'}]`);

      } catch (error) {
        console.error(`Error in backtest for ${currentDate}:`, error.message);
        continue;
      }
    }

    // 计算评估指标
    const winRate = totalTrades > 0 ? winCount / totalTrades : 0;
    const avgReturn = totalTrades > 0 ? totalReturn / totalTrades : 0;
    const totalReturnPercent = (totalReturn * 100).toFixed(2);
    
    // 计算夏普比率（简化版）
    const returns = trades.filter(t => t.prediction !== 'hold').map(t => parseFloat(t.tradeReturn) / 100);
    const avgReturnDaily = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const variance = returns.length > 0 ? returns.reduce((a, b) => a + Math.pow(b - avgReturnDaily, 2), 0) / returns.length : 0;
    const sharpeRatio = variance > 0 ? avgReturnDaily / Math.sqrt(variance) : 0;

    const evaluation = {
      symbol,
      testPeriod: `${days} days`,
      totalTrades,
      winCount,
      winRate: (winRate * 100).toFixed(2) + '%',
      totalReturn: totalReturnPercent + '%',
      avgReturn: (avgReturn * 100).toFixed(2) + '%',
      sharpeRatio: sharpeRatio.toFixed(3),
      trades: trades.slice(-10), // 只保存最近10笔交易
      timestamp: new Date().toISOString()
    };

    // 保存评估结果
    await fs.writeJson(`storage/backtest_${symbol}_${Date.now()}.json`, evaluation, { spaces: 2 });
    await fs.writeJson('storage/last_backtest.json', evaluation, { spaces: 2 });

    console.log(`\n=== Backtest Results ===`);
    console.log(`Symbol: ${symbol}`);
    console.log(`Total Trades: ${totalTrades}`);
    console.log(`Win Rate: ${evaluation.winRate}`);
    console.log(`Total Return: ${evaluation.totalReturn}`);
    console.log(`Avg Return: ${evaluation.avgReturn}`);
    console.log(`Sharpe Ratio: ${evaluation.sharpeRatio}`);

    return winRate;

  } catch (error) {
    console.error('Backtest evaluation error:', error.message);
    return 0.5; // 返回中性分数
  }
}

// 简化的回测函数，用于快速评估
export async function quickBacktest(workflow, symbol = 'AAPL', days = 30) {
  try {
    console.log(`Quick backtest for ${symbol} (${days} days)...`);
    
    const kline = await fetchKline(symbol, '6mo');
    if (kline.length < days + 10) {
      return 0.5;
    }

    let correct = 0;
    let total = 0;

    for (let i = 10; i < Math.min(days + 10, kline.length - 1); i++) {
      const currentPrice = kline[i].close;
      const nextPrice = kline[i + 1].close;
      const actualReturn = nextPrice - currentPrice;

      try {
        const result = await workflow({ symbol, dateIdx: i });
        if (result && result.prediction) {
          const signal = result.prediction.signal;
          const isCorrect = (signal === 'buy' && actualReturn > 0) || 
                           (signal === 'sell' && actualReturn < 0) ||
                           (signal === 'hold');
          
          if (signal !== 'hold') {
            correct += isCorrect ? 1 : 0;
            total++;
          }
        }
      } catch (error) {
        continue;
      }
    }

    return total > 0 ? correct / total : 0.5;
  } catch (error) {
    console.error('Quick backtest error:', error.message);
    return 0.5;
  }
}
