import llmClient from '../utils/llm.js';

export async function sentiment(news) {
  if (!news || news.length === 0) {
    return generateMockSentiment();
  }

  try {
    console.log('Analyzing news sentiment...');
    
    // 准备新闻文本
    const newsText = news.map(item => item.title).join('\n');
    
    const prompt = `
请分析以下股票相关新闻的情感倾向，并给出详细的情感分析结果：

新闻标题：
${newsText}

请从以下维度进行分析：
1. 整体情感倾向（positive/negative/neutral）
2. 情感强度（0-1，0为最消极，1为最积极）
3. 市场影响预期（bullish/bearish/neutral）
4. 关键情感词汇
5. 置信度（0-1）

请以JSON格式返回结果：
{
  "overall_sentiment": "positive/negative/neutral",
  "sentiment_score": 0.75,
  "market_impact": "bullish/bearish/neutral",
  "key_words": ["positive_word1", "negative_word2"],
  "confidence": 0.8,
  "analysis": "详细分析说明"
}
`;

    const systemPrompt = `你是一个专业的金融新闻情感分析专家。请准确分析新闻对股票价格的影响，考虑市场情绪、公司基本面、宏观经济等因素。`;

    const result = await llmClient.extractJSON(prompt, systemPrompt);
    
    if (result) {
      console.log('Sentiment analysis completed');
      return {
        ...result,
        news_count: news.length,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('Failed to parse sentiment analysis result');
    }

  } catch (error) {
    console.error('Sentiment analysis error:', error.message);
    return generateMockSentiment(news);
  }
}

function generateMockSentiment(news = []) {
  const sentiments = ['positive', 'negative', 'neutral'];
  const impacts = ['bullish', 'bearish', 'neutral'];
  
  const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
  const impact = impacts[Math.floor(Math.random() * impacts.length)];
  
  let score = 0.5;
  if (sentiment === 'positive') score = 0.6 + Math.random() * 0.4;
  else if (sentiment === 'negative') score = Math.random() * 0.4;
  
  const positiveWords = ['strong', 'growth', 'profit', 'success', 'innovation', 'expansion'];
  const negativeWords = ['decline', 'loss', 'risk', 'concern', 'weakness', 'challenge'];
  const neutralWords = ['announce', 'report', 'update', 'change', 'develop', 'plan'];
  
  let keyWords = [];
  if (sentiment === 'positive') {
    keyWords = positiveWords.slice(0, 2 + Math.floor(Math.random() * 2));
  } else if (sentiment === 'negative') {
    keyWords = negativeWords.slice(0, 2 + Math.floor(Math.random() * 2));
  } else {
    keyWords = neutralWords.slice(0, 2 + Math.floor(Math.random() * 2));
  }
  
  return {
    overall_sentiment: sentiment,
    sentiment_score: score,
    market_impact: impact,
    key_words: keyWords,
    confidence: 0.7 + Math.random() * 0.3,
    analysis: `Mock sentiment analysis based on ${news.length} news items. Overall sentiment is ${sentiment} with ${impact} market impact.`,
    news_count: news.length,
    timestamp: new Date().toISOString()
  };
}
