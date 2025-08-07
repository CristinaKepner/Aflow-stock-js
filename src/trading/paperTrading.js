import fs from 'fs-extra';
import { fetchKline } from '../nodes/fetchKline.js';

export class PaperTrading {
  constructor(symbol = 'AAPL', initialCapital = 10000) {
    this.symbol = symbol;
    this.initialCapital = initialCapital;
    this.capital = initialCapital;
    this.positions = new Map();
    this.trades = [];
    this.currentPrices = new Map();
    this.isRunning = false;
    this.workflow = null;
    this.interval = 60000;
    this.tradingInterval = null;
    this.dataFile = 'storage/paper_trading.json';
  }

  async start() {
    if (this.isRunning) {
      console.log('Paper trading is already running');
      return;
    }

    this.isRunning = true;
    
    console.log(`🚀 Starting paper trading for ${this.symbol} with $${this.initialCapital.toLocaleString()}`);
    console.log(`Interval: ${this.interval / 1000}s`);

    await this.loadState();

    this.tradingInterval = setInterval(async () => {
      await this.tradingCycle();
    }, this.interval);

    await this.tradingCycle();
  }

  async stop() {
    if (!this.isRunning) {
      console.log('Paper trading is not running');
      return;
    }

    this.isRunning = false;
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval);
      this.tradingInterval = null;
    }

    await this.saveState();
    console.log('🛑 Paper trading stopped');
    console.log(`Final capital: $${this.capital.toLocaleString()}`);
    console.log(`Total return: ${(((this.capital - this.initialCapital) / this.initialCapital) * 100).toFixed(2)}%`);
  }

  async tradingCycle() {
    const timestamp = new Date();
    console.log(`\n📊 Trading cycle at ${timestamp.toLocaleString()}`);

    try {
      await this.updatePrices();
      await this.processSymbol(timestamp);
      await this.saveState();
      this.printStatus();
    } catch (error) {
      console.error('Trading cycle error:', error.message);
    }
  }

  async updatePrices() {
    try {
      const kline = await fetchKline(this.symbol, '1d');
      if (kline && kline.length > 0) {
        const latestPrice = kline[kline.length - 1].close;
        this.currentPrices.set(this.symbol, latestPrice);
      }
    } catch (error) {
      console.error(`Failed to update price for ${this.symbol}:`, error.message);
    }
  }

  async processSymbol(timestamp) {
    try {
      const currentPrice = this.currentPrices.get(this.symbol);
      if (!currentPrice) {
        console.log(`No price data for ${this.symbol}`);
        return;
      }

      const signal = await this.generateSignal();
      if (signal) {
        await this.executeTrade(signal, currentPrice, timestamp);
      }
    } catch (error) {
      console.error(`Error processing ${this.symbol}:`, error.message);
    }
  }

  async generateSignal() {
    try {
      const signals = ['buy', 'sell', 'hold'];
      const signal = signals[Math.floor(Math.random() * signals.length)];
      const confidence = 0.5 + Math.random() * 0.4;
      
      return {
        signal,
        confidence,
        reasoning: 'Mock signal generation'
      };
    } catch (error) {
      console.error('Signal generation error:', error.message);
      return null;
    }
  }

  async executeTrade(signal, price, timestamp) {
    const position = this.positions.get(this.symbol) || { shares: 0, avgPrice: 0 };
    
    if (signal.signal === 'buy' && position.shares === 0) {
      const shares = Math.floor(this.capital * 0.1 / price);
      if (shares > 0) {
        const cost = shares * price;
        this.capital -= cost;
        this.positions.set(this.symbol, { shares, avgPrice: price });
        
        this.trades.push({
          timestamp,
          symbol: this.symbol,
          action: 'buy',
          shares,
          price,
          cost,
          confidence: signal.confidence
        });
        
        console.log(`📈 BUY ${shares} shares of ${this.symbol} at $${price}`);
      }
    } else if (signal.signal === 'sell' && position.shares > 0) {
      const shares = position.shares;
      const revenue = shares * price;
      this.capital += revenue;
      this.positions.delete(this.symbol);
      
      this.trades.push({
        timestamp,
        symbol: this.symbol,
        action: 'sell',
        shares,
        price,
        revenue,
        profit: revenue - (shares * position.avgPrice),
        confidence: signal.confidence
      });
      
      console.log(`📉 SELL ${shares} shares of ${this.symbol} at $${price}`);
    }
  }

  printStatus() {
    const portfolioValue = this.getPortfolioValue();
    const totalReturn = ((portfolioValue - this.initialCapital) / this.initialCapital) * 100;
    
    console.log(`💰 Capital: $${this.capital.toLocaleString()}`);
    console.log(`📊 Portfolio Value: $${portfolioValue.toLocaleString()}`);
    console.log(`📈 Total Return: ${totalReturn.toFixed(2)}%`);
    console.log(`📋 Positions: ${this.positions.size}`);
  }

  async saveState() {
    const state = {
      symbol: this.symbol,
      capital: this.capital,
      positions: Object.fromEntries(this.positions),
      trades: this.trades.slice(-100),
      timestamp: new Date().toISOString()
    };
    
    await fs.writeJson(this.dataFile, state, { spaces: 2 });
  }

  async loadState() {
    try {
      if (await fs.pathExists(this.dataFile)) {
        const state = await fs.readJson(this.dataFile);
        this.capital = state.capital || this.initialCapital;
        this.positions = new Map(Object.entries(state.positions || {}));
        this.trades = state.trades || [];
        console.log('📂 Loaded previous trading state');
      }
    } catch (error) {
      console.log('No previous state found, starting fresh');
    }
  }

  getPortfolioValue() {
    let value = this.capital;
    for (const [symbol, position] of this.positions.entries()) {
      const currentPrice = this.currentPrices.get(symbol) || position.avgPrice;
      value += position.shares * currentPrice;
    }
    return value;
  }

  getPerformanceStats() {
    const portfolioValue = this.getPortfolioValue();
    const totalReturn = ((portfolioValue - this.initialCapital) / this.initialCapital) * 100;
    
    const completedTrades = this.trades.filter(t => t.action === 'sell');
    const winningTrades = completedTrades.filter(t => t.profit > 0);
    const winRate = completedTrades.length > 0 ? winningTrades.length / completedTrades.length : 0;
    
    return {
      totalReturn,
      winRate,
      totalTrades: completedTrades.length,
      capital: this.capital,
      portfolioValue
    };
  }
}
