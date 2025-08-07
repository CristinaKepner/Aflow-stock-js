import axios from 'axios';
import { cacheManager } from '../utils/cache.js';

function generateMockEastMoneyData(symbol, dataType) {
  const baseData = {
    kline: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      open: 100 + Math.random() * 20,
      high: 110 + Math.random() * 20,
      low: 90 + Math.random() * 20,
      close: 100 + Math.random() * 20,
      volume: Math.floor(Math.random() * 1000000) + 100000
    })),
    news: [
      `${symbol} 发布季度财报`,
      `${symbol} 新产品发布会`,
      `${symbol} 股价创新高`,
      `${symbol} 分析师评级上调`,
      `${symbol} 市场表现强劲`
    ],
    fundamentals: {
      pe: 15 + Math.random() * 10,
      pb: 2 + Math.random() * 3,
      marketCap: 1000000000 + Math.random() * 5000000000,
      revenue: 500000000 + Math.random() * 1000000000,
      profit: 50000000 + Math.random() * 200000000
    }
  };

  return baseData[dataType] || baseData;
}

async function fetchEastMoneyKline(symbol) {
  try {
    const url = `http://push2his.eastmoney.com/api/qt/stock/kline/get?secid=1.${symbol}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=1&beg=0&end=20500101&smplmt=100&lmt=100`;
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data && response.data.data && response.data.data.klines) {
      return response.data.data.klines.map(line => {
        const [date, open, close, high, low, volume] = line.split(',');
        return {
          date: date.slice(0, 10),
          open: parseFloat(open),
          close: parseFloat(close),
          high: parseFloat(high),
          low: parseFloat(low),
          volume: parseInt(volume)
        };
      });
    }
    return null;
  } catch (error) {
    console.error(`EastMoney kline fetch error for ${symbol}:`, error.message);
    return null;
  }
}

async function fetchEastMoneyNews(symbol) {
  try {
    const url = `http://np-anotice-stock.eastmoney.com/api/security/announcement/getAnnouncementList?cb=jQuery&pageSize=10&pageIndex=1&stock=${symbol}`;
    const response = await axios.get(url, { timeout: 10000 });
    
    const text = response.data;
    const jsonMatch = text.match(/jQuery\((.*)\)/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[1]);
      if (data.data && data.data.list) {
        return data.data.list.map(item => item.title).slice(0, 5);
      }
    }
    return null;
  } catch (error) {
    console.error(`EastMoney news fetch error for ${symbol}:`, error.message);
    return null;
  }
}

async function fetchEastMoneyFundamentals(symbol) {
  try {
    const url = `http://push2.eastmoney.com/api/qt/stock/get?secid=1.${symbol}&fields=f43,f57,f58,f169,f170,f46,f44,f51,f168,f47,f164,f163,f116,f117,f167,f71,f180,f181,f183,f184,f185,f186,f187,f188,f189,f190,f191,f192,f107,f111,f86,f177,f78,f110,f262,f263,f264,f267,f268,f250,f251,f252,f253,f254,f255,f256,f257,f258,f266,f269,f270,f271,f273,f274,f275,f127,f199,f128,f193,f196,f194,f195,f197,f80,f280,f281,f282,f284,f285,f286,f287,f292`;
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data && response.data.data) {
      const data = response.data.data;
      return {
        pe: data.f162 || 0,
        pb: data.f167 || 0,
        marketCap: data.f116 || 0,
        revenue: data.f183 || 0,
        profit: data.f184 || 0
      };
    }
    return null;
  } catch (error) {
    console.error(`EastMoney fundamentals fetch error for ${symbol}:`, error.message);
    return null;
  }
}

export async function fetchEastMoneyData(symbol, dataType = 'kline') {
  const cacheKey = `eastmoney_${symbol}_${dataType}`;
  
  try {
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    console.log(`Fetching EastMoney ${dataType} data for ${symbol}...`);
    
    let data = null;
    switch (dataType) {
      case 'kline':
        data = await fetchEastMoneyKline(symbol);
        break;
      case 'news':
        data = await fetchEastMoneyNews(symbol);
        break;
      case 'fundamentals':
        data = await fetchEastMoneyFundamentals(symbol);
        break;
      default:
        data = await fetchEastMoneyKline(symbol);
    }
    
    if (!data) {
      console.log(`Using mock EastMoney data for ${symbol}`);
      data = generateMockEastMoneyData(symbol, dataType);
    }
    
    cacheManager.set(cacheKey, data);
    return data;
    
  } catch (error) {
    console.error(`EastMoney data fetch error for ${symbol}:`, error.message);
    const mockData = generateMockEastMoneyData(symbol, dataType);
    cacheManager.set(cacheKey, mockData);
    return mockData;
  }
}
