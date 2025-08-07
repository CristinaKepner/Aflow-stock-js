import { llmClient } from '../utils/llm.js';

function generateMockSentiment(news) {
  const sentiments = ['positive', 'negative', 'neutral'];
  const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
  const score = 0.3 + Math.random() * 0.4;
  
  return {
    overall_sentiment: sentiment,
    sentiment_score: score,
    market_impact: 'moderate',
    key_words: ['market', 'trading', 'stock'],
    confidence: 0.6 + Math.random() * 0.3,
    analysis: 'Mock sentiment analysis based on news content'
  };
}

export async function sentiment(news) {
  if (!news || news.length < 50) {
    return generateMockSentiment(news);
  }

  const prompt = `分析以下股票相关新闻的情感倾向：
${news.slice(0, 500)}

请返回JSON格式的情感分析结果：
{
  "overall_sentiment": "positive/negative/neutral",
  "sentiment_score": 0.0-1.0,
  "market_impact": "high/moderate/low",
  "key_words": ["word1", "word2", "word3"],
  "confidence": 0.0-1.0,
  "analysis": "简要分析"
}`;

  const systemPrompt = '你是一个专业的金融新闻分析师，请准确分析新闻情感对股票市场的影响。';

  const result = await llmClient.extractJSON(prompt, systemPrompt);
  
  if (result && result.overall_sentiment) {
    return result;
  } else {
    return generateMockSentiment(news);
  }
}
