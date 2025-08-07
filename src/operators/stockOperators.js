import { fetchKline } from '../nodes/fetchKline.js';
import { technical } from '../nodes/technical.js';
import { fetchNews } from '../nodes/news.js';
import { sentiment } from '../nodes/sentiment.js';
import { predict } from '../nodes/predict.js';

export const StockOperators = {
  // 基础数据获取
  async FetchKline(symbol, period = '1y') {
    console.log(`\n=== FetchKline Operator ===`);
    const kline = await fetchKline(symbol, period);
    return { symbol, kline };
  },

  // 技术分析
  async TechnicalAnalysis(ctx) {
    console.log(`\n=== TechnicalAnalysis Operator ===`);
    if (!ctx.kline) {
      throw new Error('Kline data required for technical analysis');
    }
    const tech = await technical(ctx.kline);
    return { ...ctx, tech };
  },

  // 新闻获取
  async FetchNews(ctx) {
    console.log(`\n=== FetchNews Operator ===`);
    const news = await fetchNews(ctx.symbol);
    return { ...ctx, news };
  },

  // 情感分析
  async SentimentAnalysis(ctx) {
    console.log(`\n=== SentimentAnalysis Operator ===`);
    if (!ctx.news) {
      throw new Error('News data required for sentiment analysis');
    }
    const sentimentResult = await sentiment(ctx.news);
    return { ...ctx, sentiment: sentimentResult };
  },

  // 预测信号
  async GeneratePrediction(ctx) {
    console.log(`\n=== GeneratePrediction Operator ===`);
    const prediction = await predict(ctx);
    return { ...ctx, prediction };
  },

  // 组合操作：技术分析流程
  async FetchTech(ctx) {
    console.log(`\n=== FetchTech Combined Operator ===`);
    const kline = await fetchKline(ctx.symbol, ctx.period || '1y');
    const tech = await technical(kline);
    return { ...ctx, kline, tech };
  },

  // 组合操作：新闻情感流程
  async NewsSentiment(ctx) {
    console.log(`\n=== NewsSentiment Combined Operator ===`);
    const news = await fetchNews(ctx.symbol);
    const sentimentResult = await sentiment(news);
    return { ...ctx, news, sentiment: sentimentResult };
  },

  // 组合操作：完整分析流程
  async FullAnalysis(ctx) {
    console.log(`\n=== FullAnalysis Combined Operator ===`);
    const kline = await fetchKline(ctx.symbol, ctx.period || '1y');
    const tech = await technical(kline);
    const news = await fetchNews(ctx.symbol);
    const sentimentResult = await sentiment(news);
    const prediction = await predict({ ...ctx, kline, tech, sentiment: sentimentResult });
    
    return {
      ...ctx,
      kline,
      tech,
      news,
      sentiment: sentimentResult,
      prediction
    };
  },

  // 轻量级分析（仅技术指标）
  async LightAnalysis(ctx) {
    console.log(`\n=== LightAnalysis Operator ===`);
    const kline = await fetchKline(ctx.symbol, '6mo');
    const tech = await technical(kline);
    const prediction = await predict({ ...ctx, kline, tech });
    
    return {
      ...ctx,
      kline,
      tech,
      prediction
    };
  },

  // 情感驱动分析
  async SentimentDriven(ctx) {
    console.log(`\n=== SentimentDriven Operator ===`);
    const news = await fetchNews(ctx.symbol);
    const sentimentResult = await sentiment(news);
    const prediction = await predict({ ...ctx, sentiment: sentimentResult });
    
    return {
      ...ctx,
      news,
      sentiment: sentimentResult,
      prediction
    };
  }
};

// 预定义的workflow模板
export const WorkflowTemplates = {
  // 模板1：技术分析为主
  technical: `
async function technicalWorkflow(ctx) {
  const { kline } = await StockOperators.FetchKline(ctx.symbol);
  const { tech } = await StockOperators.TechnicalAnalysis({ ...ctx, kline });
  const { prediction } = await StockOperators.GeneratePrediction({ ...ctx, kline, tech });
  return { ...ctx, kline, tech, prediction };
}
  `,

  // 模板2：情感分析为主
  sentiment: `
async function sentimentWorkflow(ctx) {
  const { news } = await StockOperators.FetchNews(ctx);
  const { sentiment } = await StockOperators.SentimentAnalysis({ ...ctx, news });
  const { prediction } = await StockOperators.GeneratePrediction({ ...ctx, sentiment });
  return { ...ctx, news, sentiment, prediction };
}
  `,

  // 模板3：完整分析
  full: `
async function fullWorkflow(ctx) {
  const { kline } = await StockOperators.FetchKline(ctx.symbol);
  const { tech } = await StockOperators.TechnicalAnalysis({ ...ctx, kline });
  const { news } = await StockOperators.FetchNews(ctx);
  const { sentiment } = await StockOperators.SentimentAnalysis({ ...ctx, news });
  const { prediction } = await StockOperators.GeneratePrediction({ ...ctx, kline, tech, sentiment });
  return { ...ctx, kline, tech, news, sentiment, prediction };
}
  `,

  // 模板4：快速分析
  quick: `
async function quickWorkflow(ctx) {
  const result = await StockOperators.LightAnalysis(ctx);
  return result;
}
  `
};
