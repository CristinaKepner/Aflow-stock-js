import axios from 'axios';
import { cacheManager } from '../utils/cache.js';

function generateMockKline(symbol, period = '1y') {
  const days = period.includes('y') ? 365 : period.includes('mo') ? 30 : period.includes('w') ? 7 : 1;
  const kline = [];
  let basePrice = 100 + Math.random() * 50;
  
  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.5) * 0.1;
    basePrice *= (1 + change);
    
    const open = basePrice * (1 + (Math.random() - 0.5) * 0.02);
    const close = basePrice;
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    kline.push({
      date: date.toISOString().slice(0, 10),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: volume
    });
  }
  
  return kline;
}

export async function fetchKline(symbol = 'AAPL', period = '1y') {
  const cacheKey = `kline_${symbol}_${period}`;
  
  try {
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    console.log(`Fetching kline data for ${symbol}...`);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${period}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const data = response.data;
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('Invalid response format');
    }
    
    const result = data.chart.result[0];
    const { timestamp, indicators } = result;
    
    if (!timestamp || !indicators.quote || indicators.quote.length === 0) {
      throw new Error('Missing data in response');
    }
    
    const quote = indicators.quote[0];
    const { open, high, low, close, volume } = quote;
    
    const kline = timestamp.map((t, i) => ({
      date: new Date(t * 1000).toISOString().slice(0, 10),
      open: open[i] || 0,
      high: high[i] || 0,
      low: low[i] || 0,
      close: close[i] || 0,
      volume: volume[i] || 0
    })).filter(item => item.close > 0);
    
    cacheManager.set(cacheKey, kline);
    return kline;
    
  } catch (error) {
    console.error(`Error fetching kline for ${symbol}:`, error.message);
    console.log('Using mock data for', symbol);
    const mockData = generateMockKline(symbol, period);
    cacheManager.set(cacheKey, mockData);
    return mockData;
  }
}
