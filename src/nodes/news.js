import axios from 'axios';
import * as cheerio from 'cheerio';
import { cacheManager } from '../utils/cache.js';

function generateMockNews(symbol) {
  const mockTitles = [
    `${symbol} reports strong quarterly earnings`,
    `Analysts upgrade ${symbol} stock rating`,
    `${symbol} announces new product launch`,
    `Market volatility affects ${symbol} shares`,
    `${symbol} expands into new markets`,
    `Institutional investors increase ${symbol} holdings`,
    `${symbol} faces regulatory challenges`,
    `Competition heats up for ${symbol}`,
    `${symbol} partners with tech giant`,
    `${symbol} stock reaches new highs`
  ];
  
  return mockTitles.slice(0, 5).join('\n');
}

async function fetchYahooNews(symbol) {
  try {
    const url = `https://finance.yahoo.com/quote/${symbol}/news`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const titles = $('h3').slice(0, 10).map((_, el) => $(el).text().trim()).get();
    return titles.join('\n');
  } catch (error) {
    console.error(`Yahoo news fetch error for ${symbol}:`, error.message);
    return null;
  }
}

async function fetchSinaNews(symbol) {
  try {
    const url = `https://finance.sina.com.cn/realstock/company/us_${symbol}/nc.shtml`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const titles = $('a[target=_blank]').slice(0, 10).map((_, el) => $(el).text().trim()).get();
    return titles.join('\n');
  } catch (error) {
    console.error(`Sina news fetch error for ${symbol}:`, error.message);
    return null;
  }
}

export async function fetchNews(symbol = 'AAPL') {
  const cacheKey = `news_${symbol}`;
  
  try {
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    console.log(`Fetching news for ${symbol}...`);
    
    let news = await fetchYahooNews(symbol);
    if (!news || news.length < 50) {
      news = await fetchSinaNews(symbol);
    }
    
    if (!news || news.length < 50) {
      console.log(`Using mock news for ${symbol}`);
      news = generateMockNews(symbol);
    }
    
    cacheManager.set(cacheKey, news);
    return news;
    
  } catch (error) {
    console.error(`News fetch error for ${symbol}:`, error.message);
    const mockNews = generateMockNews(symbol);
    cacheManager.set(cacheKey, mockNews);
    return mockNews;
  }
}
