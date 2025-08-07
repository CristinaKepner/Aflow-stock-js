import { llmClient } from '../utils/llm.js';

function generateMockPrediction(context) {
  const signals = ['buy', 'sell', 'hold'];
  const signal = signals[Math.floor(Math.random() * signals.length)];
  const confidence = 0.5 + Math.random() * 0.4;
  
  return {
    signal,
    confidence,
    reasoning: 'Mock prediction based on technical analysis',
    target_price: 100 + (Math.random() - 0.5) * 20,
    stop_loss: 95 + (Math.random() - 0.5) * 10,
    risk_level: 'medium',
    timeframe: '1d',
    key_factors: ['technical_analysis', 'market_sentiment']
  };
}

export async function predict(context) {
  const { kline, tech, sentiment, news } = context;
  
  if (!kline || !tech) {
    return generateMockPrediction(context);
  }

  const latestPrice = kline[kline.length - 1]?.close || 100;
  const rsi = tech.rsi?.value || 50;
  const macd = tech.macd?.MACD || 0;
  const bb = tech.bb?.upper || latestPrice;

  const prompt = `基于以下股票数据生成交易信号：
价格: ${latestPrice}
RSI: ${rsi}
MACD: ${macd}
布林带: ${bb}
${sentiment ? `情绪分析: ${sentiment.overall_sentiment} (${sentiment.score})` : ''}
${news ? `新闻摘要: ${news.slice(0, 200)}` : ''}

请返回JSON格式的交易信号，包含以下字段：
{
  "signal": "buy/sell/hold",
  "confidence": 0.0-1.0,
  "reasoning": "分析理由",
  "target_price": 目标价格,
  "stop_loss": 止损价格,
  "risk_level": "low/medium/high",
  "timeframe": "1d/1w/1m",
  "key_factors": ["factor1", "factor2"]
}`;

  const systemPrompt = '你是一个专业的股票分析师，基于技术指标和市场情绪给出交易建议。';

  const result = await llmClient.extractJSON(prompt, systemPrompt);
  
  if (result && result.signal) {
    console.log('Prediction generated successfully');
    return {
      ...result,
      timestamp: new Date().toISOString(),
      data_sources: Object.keys(context).filter(key => context[key] !== undefined)
    };
  } else {
    console.warn('Using fallback prediction due to parsing error');
    return generateMockPrediction(context);
  }
}
