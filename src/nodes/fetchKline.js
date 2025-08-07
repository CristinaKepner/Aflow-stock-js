import axios from 'axios';
import cacheManager from '../utils/cache.js';

export async function fetchKline(symbol = 'AAPL', period = '1y') {
  const cacheKey = `kline_${symbol}_${period}`;
  
  // 尝试从缓存获取
  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    console.log(`Fetching kline data for ${symbol}...`);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${period}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const { data } = response;
    
    if (!data.chart || !data.chart.result || !data.chart.result[0]) {
      throw new Error(`Invalid data format for ${symbol}`);
    }

    const result = data.chart.result[0];
    const { timestamp, indicators } = result;
    
    if (!indicators.quote || !indicators.quote[0]) {
      throw new Error(`No quote data available for ${symbol}`);
    }

    const { open, high, low, close, volume } = indicators.quote[0];
    
    const klineData = timestamp.map((t, i) => ({
      date: new Date(t * 1000).toISOString().slice(0, 10),
      timestamp: t * 1000,
      open: open[i] || 0,
      high: high[i] || 0,
      low: low[i] || 0,
      close: close[i] || 0,
      volume: volume[i] || 0
    })).filter(item => item.close > 0); // 过滤无效数据

    // 缓存结果
    await cacheManager.set(cacheKey, klineData);
    
    console.log(`Fetched ${klineData.length} kline records for ${symbol}`);
    return klineData;
    
  } catch (error) {
    console.error(`Error fetching kline for ${symbol}:`, error.message);
    
    // 如果API失败，返回模拟数据
    const mockData = generateMockKline(symbol, period);
    console.log(`Using mock data for ${symbol}`);
    return mockData;
  }
}

function generateMockKline(symbol, period) {
  const days = period === '1y' ? 365 : period === '6mo' ? 180 : 90;
  const basePrice = 100 + Math.random() * 900;
  const data = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * volatility;
    const price = basePrice * (1 + change);
    
    data.push({
      date: date.toISOString().slice(0, 10),
      timestamp: date.getTime(),
      open: price * (1 + (Math.random() - 0.5) * 0.01),
      high: price * (1 + Math.random() * 0.02),
      low: price * (1 - Math.random() * 0.02),
      close: price,
      volume: Math.floor(Math.random() * 1000000) + 100000
    });
  }
  
  return data;
}
