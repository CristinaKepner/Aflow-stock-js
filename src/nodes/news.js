import axios from 'axios';
import cheerio from 'cheerio';
import cacheManager from '../utils/cache.js';

export async function fetchNews(symbol = 'AAPL') {
  const cacheKey = `news_${symbol}`;
  
  // 尝试从缓存获取
  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    console.log(`Fetching news for ${symbol}...`);
    
    // 尝试多个新闻源
    const newsSources = [
      () => fetchYahooNews(symbol),
      () => fetchSinaNews(symbol),
      () => fetchMockNews(symbol)
    ];

    let newsData = null;
    for (const source of newsSources) {
      try {
        newsData = await source();
        if (newsData && newsData.length > 0) {
          break;
        }
      } catch (error) {
        console.warn(`News source failed: ${error.message}`);
        continue;
      }
    }

    if (!newsData || newsData.length === 0) {
      newsData = generateMockNews(symbol);
    }

    // 缓存结果
    await cacheManager.set(cacheKey, newsData);
    
    console.log(`Fetched ${newsData.length} news items for ${symbol}`);
    return newsData;
    
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error.message);
    return generateMockNews(symbol);
  }
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
    const news = [];

    // 尝试不同的选择器
    $('h3, h4, .js-content-viewer, .Ov(h)').each((i, element) => {
      const text = $(element).text().trim();
      if (text.length > 10 && text.length < 200 && i < 10) {
        news.push({
          title: text,
          source: 'Yahoo Finance',
          timestamp: new Date().toISOString()
        });
      }
    });

    return news;
  } catch (error) {
    throw new Error(`Yahoo news fetch failed: ${error.message}`);
  }
}

async function fetchSinaNews(symbol) {
  try {
    // 对于美股，使用新浪财经的搜索
    const url = `https://finance.sina.com.cn/realstock/company/us_${symbol}/nc.shtml`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const news = [];

    $('a[target="_blank"], .news-item a').each((i, element) => {
      const text = $(element).text().trim();
      if (text.length > 10 && text.length < 200 && i < 10) {
        news.push({
          title: text,
          source: 'Sina Finance',
          timestamp: new Date().toISOString()
        });
      }
    });

    return news;
  } catch (error) {
    throw new Error(`Sina news fetch failed: ${error.message}`);
  }
}

async function fetchMockNews(symbol) {
  // 模拟新闻数据
  const mockTitles = [
    `${symbol} Reports Strong Q4 Earnings`,
    `${symbol} Announces New Product Launch`,
    `${symbol} Stock Hits All-Time High`,
    `${symbol} CEO Interview on Market Outlook`,
    `${symbol} Expands Global Operations`,
    `${symbol} Partners with Tech Giant`,
    `${symbol} Revenue Exceeds Expectations`,
    `${symbol} Announces Stock Buyback Program`,
    `${symbol} Innovation in AI Technology`,
    `${symbol} Market Analyst Recommendations`
  ];

  return mockTitles.map((title, index) => ({
    title,
    source: 'Mock News',
    timestamp: new Date(Date.now() - index * 86400000).toISOString() // 每天一条
  }));
}

function generateMockNews(symbol) {
  const mockTitles = [
    `${symbol} Reports Strong Q4 Earnings`,
    `${symbol} Announces New Product Launch`,
    `${symbol} Stock Hits All-Time High`,
    `${symbol} CEO Interview on Market Outlook`,
    `${symbol} Expands Global Operations`,
    `${symbol} Partners with Tech Giant`,
    `${symbol} Revenue Exceeds Expectations`,
    `${symbol} Announces Stock Buyback Program`,
    `${symbol} Innovation in AI Technology`,
    `${symbol} Market Analyst Recommendations`
  ];

  return mockTitles.map((title, index) => ({
    title,
    source: 'Mock News',
    timestamp: new Date(Date.now() - index * 86400000).toISOString(),
    sentiment: Math.random() > 0.5 ? 'positive' : 'negative',
    relevance: 0.7 + Math.random() * 0.3
  }));
}
