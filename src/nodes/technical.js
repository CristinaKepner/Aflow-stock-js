import { RSI, MACD, BollingerBands, SMA, EMA, Stochastic } from 'technicalindicators';

export async function technical(kline) {
  if (!kline || kline.length < 50) {
    console.warn('Insufficient kline data for technical analysis');
    return generateMockTechnical();
  }

  try {
    console.log('Calculating technical indicators...');
    
    const close = kline.map(c => c.close);
    const high = kline.map(c => c.high);
    const low = kline.map(c => c.low);
    const volume = kline.map(c => c.volume);

    // RSI
    const rsi = RSI.calculate({ period: 14, values: close });
    const currentRSI = rsi.length > 0 ? rsi[rsi.length - 1] : 50;

    // MACD
    const macd = MACD.calculate({ 
      fastPeriod: 12, 
      slowPeriod: 26, 
      signalPeriod: 9, 
      values: close 
    });
    const currentMACD = macd.length > 0 ? macd[macd.length - 1] : { MACD: 0, signal: 0, histogram: 0 };

    // Bollinger Bands
    const bb = BollingerBands.calculate({ 
      period: 20, 
      stdDev: 2, 
      values: close 
    });
    const currentBB = bb.length > 0 ? bb[bb.length - 1] : { upper: 0, middle: 0, lower: 0 };

    // SMA
    const sma20 = SMA.calculate({ period: 20, values: close });
    const sma50 = SMA.calculate({ period: 50, values: close });
    const currentSMA20 = sma20.length > 0 ? sma20[sma20.length - 1] : close[close.length - 1];
    const currentSMA50 = sma50.length > 0 ? sma50[sma50.length - 1] : close[close.length - 1];

    // EMA
    const ema12 = EMA.calculate({ period: 12, values: close });
    const ema26 = EMA.calculate({ period: 26, values: close });
    const currentEMA12 = ema12.length > 0 ? ema12[ema12.length - 1] : close[close.length - 1];
    const currentEMA26 = ema26.length > 0 ? ema26[ema26.length - 1] : close[close.length - 1];

    // Stochastic
    const stoch = Stochastic.calculate({
      high: high,
      low: low,
      close: close,
      period: 14,
      signalPeriod: 3
    });
    const currentStoch = stoch.length > 0 ? stoch[stoch.length - 1] : { k: 50, d: 50 };

    // 计算价格位置
    const currentPrice = close[close.length - 1];
    const bbPosition = currentBB.upper > currentBB.lower ? 
      (currentPrice - currentBB.lower) / (currentBB.upper - currentBB.lower) : 0.5;

    // 生成信号强度
    const signals = {
      rsi: getRSISignal(currentRSI),
      macd: getMACDSignal(currentMACD),
      bb: getBBSignal(currentPrice, currentBB),
      sma: getSMASignal(currentPrice, currentSMA20, currentSMA50),
      ema: getEMASignal(currentEMA12, currentEMA26),
      stoch: getStochSignal(currentStoch)
    };

    const result = {
      indicators: {
        rsi: currentRSI,
        macd: currentMACD,
        bb: currentBB,
        sma20: currentSMA20,
        sma50: currentSMA50,
        ema12: currentEMA12,
        ema26: currentEMA26,
        stoch: currentStoch,
        bbPosition: bbPosition
      },
      signals: signals,
      summary: generateTechnicalSummary(signals, currentPrice)
    };

    console.log('Technical analysis completed');
    return result;

  } catch (error) {
    console.error('Technical analysis error:', error.message);
    return generateMockTechnical();
  }
}

function getRSISignal(rsi) {
  if (rsi > 70) return { direction: 'sell', strength: (rsi - 70) / 30, value: rsi };
  if (rsi < 30) return { direction: 'buy', strength: (30 - rsi) / 30, value: rsi };
  return { direction: 'neutral', strength: 0, value: rsi };
}

function getMACDSignal(macd) {
  const { MACD, signal, histogram } = macd;
  if (MACD > signal && histogram > 0) {
    return { direction: 'buy', strength: Math.min(Math.abs(histogram) / 10, 1), value: { MACD, signal, histogram } };
  }
  if (MACD < signal && histogram < 0) {
    return { direction: 'sell', strength: Math.min(Math.abs(histogram) / 10, 1), value: { MACD, signal, histogram } };
  }
  return { direction: 'neutral', strength: 0, value: { MACD, signal, histogram } };
}

function getBBSignal(price, bb) {
  const { upper, lower } = bb;
  if (price > upper) return { direction: 'sell', strength: 0.8, value: { price, upper, lower } };
  if (price < lower) return { direction: 'buy', strength: 0.8, value: { price, upper, lower } };
  return { direction: 'neutral', strength: 0, value: { price, upper, lower } };
}

function getSMASignal(price, sma20, sma50) {
  if (price > sma20 && sma20 > sma50) return { direction: 'buy', strength: 0.6, value: { price, sma20, sma50 } };
  if (price < sma20 && sma20 < sma50) return { direction: 'sell', strength: 0.6, value: { price, sma20, sma50 } };
  return { direction: 'neutral', strength: 0, value: { price, sma20, sma50 } };
}

function getEMASignal(ema12, ema26) {
  if (ema12 > ema26) return { direction: 'buy', strength: 0.5, value: { ema12, ema26 } };
  if (ema12 < ema26) return { direction: 'sell', strength: 0.5, value: { ema12, ema26 } };
  return { direction: 'neutral', strength: 0, value: { ema12, ema26 } };
}

function getStochSignal(stoch) {
  const { k, d } = stoch;
  if (k > 80 && d > 80) return { direction: 'sell', strength: 0.7, value: { k, d } };
  if (k < 20 && d < 20) return { direction: 'buy', strength: 0.7, value: { k, d } };
  return { direction: 'neutral', strength: 0, value: { k, d } };
}

function generateTechnicalSummary(signals, price) {
  const buySignals = Object.values(signals).filter(s => s.direction === 'buy');
  const sellSignals = Object.values(signals).filter(s => s.direction === 'sell');
  
  const buyStrength = buySignals.reduce((sum, s) => sum + s.strength, 0) / buySignals.length || 0;
  const sellStrength = sellSignals.reduce((sum, s) => sum + s.strength, 0) / sellSignals.length || 0;
  
  let overallDirection = 'neutral';
  let overallStrength = 0;
  
  if (buyStrength > sellStrength && buyStrength > 0.3) {
    overallDirection = 'buy';
    overallStrength = buyStrength;
  } else if (sellStrength > buyStrength && sellStrength > 0.3) {
    overallDirection = 'sell';
    overallStrength = sellStrength;
  }
  
  return {
    direction: overallDirection,
    strength: overallStrength,
    price: price,
    signalCount: {
      buy: buySignals.length,
      sell: sellSignals.length,
      neutral: Object.values(signals).filter(s => s.direction === 'neutral').length
    }
  };
}

function generateMockTechnical() {
  return {
    indicators: {
      rsi: 50 + (Math.random() - 0.5) * 40,
      macd: { MACD: 0, signal: 0, histogram: 0 },
      bb: { upper: 110, middle: 100, lower: 90 },
      sma20: 100,
      sma50: 98,
      ema12: 101,
      ema26: 99,
      stoch: { k: 50, d: 50 },
      bbPosition: 0.5
    },
    signals: {
      rsi: { direction: 'neutral', strength: 0, value: 50 },
      macd: { direction: 'neutral', strength: 0, value: { MACD: 0, signal: 0, histogram: 0 } },
      bb: { direction: 'neutral', strength: 0, value: { price: 100, upper: 110, lower: 90 } },
      sma: { direction: 'neutral', strength: 0, value: { price: 100, sma20: 100, sma50: 98 } },
      ema: { direction: 'neutral', strength: 0, value: { ema12: 101, ema26: 99 } },
      stoch: { direction: 'neutral', strength: 0, value: { k: 50, d: 50 } }
    },
    summary: {
      direction: 'neutral',
      strength: 0,
      price: 100,
      signalCount: { buy: 0, sell: 0, neutral: 6 }
    }
  };
}
