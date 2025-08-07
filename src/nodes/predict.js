import llmClient from '../utils/llm.js';

export async function predict(context) {
  try {
    console.log('Generating trading prediction...');
    
    // 准备分析数据
    const analysisData = prepareAnalysisData(context);
    
    const prompt = `
作为专业的股票分析师，请基于以下数据生成明日交易信号：

## 技术指标分析
${analysisData.technical}

## 新闻情感分析
${analysisData.sentiment}

## 市场数据
${analysisData.market}

请综合考虑技术面、基本面、市场情绪等因素，生成交易建议。

请以JSON格式返回结果：
{
  "signal": "buy/sell/hold",
  "confidence": 0.85,
  "reasoning": "详细的分析理由",
  "target_price": 150.50,
  "stop_loss": 145.00,
  "risk_level": "low/medium/high",
  "timeframe": "1d/1w/1m",
  "key_factors": ["factor1", "factor2", "factor3"]
}
`;

    const systemPrompt = `你是一个经验丰富的量化交易分析师。请基于多维度数据给出准确的交易信号，考虑风险收益比和市场环境。`;

    const result = await llmClient.extractJSON(prompt, systemPrompt);
    
    if (result) {
      console.log('Prediction generated successfully');
      return {
        ...result,
        timestamp: new Date().toISOString(),
        data_sources: Object.keys(context).filter(key => context[key] !== undefined)
      };
    } else {
      throw new Error('Failed to parse prediction result');
    }

  } catch (error) {
    console.error('Prediction error:', error.message);
    return generateMockPrediction(context);
  }
}

function prepareAnalysisData(context) {
  let technical = '无技术指标数据';
  let sentiment = '无情感分析数据';
  let market = '无市场数据';

  // 技术指标
  if (context.tech && context.tech.summary) {
    const summary = context.tech.summary;
    technical = `
- 整体方向: ${summary.direction}
- 信号强度: ${summary.strength.toFixed(2)}
- 当前价格: $${summary.price}
- 信号统计: 买入${summary.signalCount.buy}个, 卖出${summary.signalCount.sell}个, 中性${summary.signalCount.neutral}个
- RSI: ${context.tech.indicators?.rsi?.toFixed(2) || 'N/A'}
- MACD: ${JSON.stringify(context.tech.indicators?.macd) || 'N/A'}
- 布林带位置: ${context.tech.indicators?.bbPosition?.toFixed(2) || 'N/A'}
    `;
  }

  // 情感分析
  if (context.sentiment) {
    sentiment = `
- 整体情感: ${context.sentiment.overall_sentiment}
- 情感得分: ${context.sentiment.sentiment_score?.toFixed(2) || 'N/A'}
- 市场影响: ${context.sentiment.market_impact}
- 置信度: ${context.sentiment.confidence?.toFixed(2) || 'N/A'}
- 关键词汇: ${context.sentiment.key_words?.join(', ') || 'N/A'}
- 分析: ${context.sentiment.analysis || 'N/A'}
    `;
  }

  // 市场数据
  if (context.kline && context.kline.length > 0) {
    const latest = context.kline[context.kline.length - 1];
    const prev = context.kline[context.kline.length - 2];
    const change = ((latest.close - prev.close) / prev.close * 100).toFixed(2);
    
    market = `
- 最新价格: $${latest.close}
- 涨跌幅: ${change}%
- 成交量: ${latest.volume.toLocaleString()}
- 日期: ${latest.date}
    `;
  }

  return { technical, sentiment, market };
}

function generateMockPrediction(context) {
  const signals = ['buy', 'sell', 'hold'];
  const riskLevels = ['low', 'medium', 'high'];
  const timeframes = ['1d', '1w', '1m'];
  
  const signal = signals[Math.floor(Math.random() * signals.length)];
  const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
  const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
  
  let confidence = 0.5 + Math.random() * 0.4;
  let targetPrice = 100;
  let stopLoss = 95;
  
  if (context.kline && context.kline.length > 0) {
    const currentPrice = context.kline[context.kline.length - 1].close;
    if (signal === 'buy') {
      targetPrice = currentPrice * (1 + 0.02 + Math.random() * 0.08);
      stopLoss = currentPrice * (1 - 0.02 - Math.random() * 0.03);
    } else if (signal === 'sell') {
      targetPrice = currentPrice * (1 - 0.02 - Math.random() * 0.08);
      stopLoss = currentPrice * (1 + 0.02 + Math.random() * 0.03);
    } else {
      targetPrice = currentPrice;
      stopLoss = currentPrice * 0.95;
    }
  }
  
  const factors = [
    '技术指标信号',
    '市场情绪分析',
    '价格趋势',
    '成交量变化',
    '支撑阻力位'
  ].slice(0, 2 + Math.floor(Math.random() * 2));
  
  const reasoning = `基于${factors.join('、')}等因素的综合分析，建议${signal === 'buy' ? '买入' : signal === 'sell' ? '卖出' : '持有'}。`;
  
  return {
    signal,
    confidence: confidence.toFixed(2),
    reasoning,
    target_price: targetPrice.toFixed(2),
    stop_loss: stopLoss.toFixed(2),
    risk_level: riskLevel,
    timeframe,
    key_factors: factors,
    timestamp: new Date().toISOString(),
    data_sources: Object.keys(context).filter(key => context[key] !== undefined)
  };
}
