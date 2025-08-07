import { fetchKline } from '../nodes/fetchKline.js';
import { technical } from '../nodes/technical.js';
import { fetchNews } from '../nodes/news.js';
import { sentiment } from '../nodes/sentiment.js';
import { predict } from '../nodes/predict.js';

export const StockOperators = {
  async FetchKline(symbol) {
    const kline = await fetchKline(symbol);
    return { kline };
  },

  async TechnicalAnalysis(context) {
    const { kline } = context;
    const tech = await technical(kline);
    return { ...context, tech };
  },

  async FetchNews(context) {
    const { symbol } = context;
    const news = await fetchNews(symbol);
    return { ...context, news };
  },

  async SentimentAnalysis(context) {
    const { news } = context;
    const sentimentResult = await sentiment(news);
    return { ...context, sentiment: sentimentResult };
  },

  async GeneratePrediction(context) {
    const prediction = await predict(context);
    return { ...context, prediction };
  },

  async LightAnalysis(context) {
    const { symbol } = context;
    const { kline } = await this.FetchKline(symbol);
    const { tech } = await this.TechnicalAnalysis({ ...context, kline });
    const { prediction } = await this.GeneratePrediction({ ...context, kline, tech });
    return { ...context, kline, tech, prediction };
  },

  async NewsSentiment(context) {
    const { symbol } = context;
    const { news } = await this.FetchNews({ ...context, symbol });
    const { sentiment } = await this.SentimentAnalysis({ ...context, news });
    return { ...context, news, sentiment };
  },

  async FullAnalysis(context) {
    const { symbol } = context;
    const { kline } = await this.FetchKline(symbol);
    const { tech } = await this.TechnicalAnalysis({ ...context, kline });
    const { news } = await this.FetchNews({ ...context, symbol });
    const { sentiment } = await this.SentimentAnalysis({ ...context, news });
    const { prediction } = await this.GeneratePrediction({ ...context, kline, tech, sentiment, news });
    return { ...context, kline, tech, news, sentiment, prediction };
  },

  async SentimentDriven(context) {
    const { symbol } = context;
    const { news } = await this.FetchNews({ ...context, symbol });
    const { sentiment } = await this.SentimentAnalysis({ ...context, news });
    const { prediction } = await this.GeneratePrediction({ ...context, sentiment, news });
    return { ...context, news, sentiment, prediction };
  }
};

export const WorkflowTemplates = {
  basic: `
async function basicWorkflow(ctx) {
  const { kline } = await StockOperators.FetchKline(ctx.symbol);
  const { tech } = await StockOperators.TechnicalAnalysis({ ...ctx, kline });
  const { prediction } = await StockOperators.GeneratePrediction({ ...ctx, kline, tech });
  return { ...ctx, kline, tech, prediction };
}`,

  advanced: `
async function advancedWorkflow(ctx) {
  const { kline } = await StockOperators.FetchKline(ctx.symbol);
  const { tech } = await StockOperators.TechnicalAnalysis({ ...ctx, kline });
  const { news } = await StockOperators.FetchNews({ ...ctx, symbol: ctx.symbol });
  const { sentiment } = await StockOperators.SentimentAnalysis({ ...ctx, news });
  const { prediction } = await StockOperators.GeneratePrediction({ ...ctx, kline, tech, sentiment, news });
  return { ...ctx, kline, tech, news, sentiment, prediction };
}`,

  sentimentOnly: `
async function sentimentWorkflow(ctx) {
  const { news } = await StockOperators.FetchNews({ ...ctx, symbol: ctx.symbol });
  const { sentiment } = await StockOperators.SentimentAnalysis({ ...ctx, news });
  const { prediction } = await StockOperators.GeneratePrediction({ ...ctx, sentiment, news });
  return { ...ctx, news, sentiment, prediction };
}`
};
