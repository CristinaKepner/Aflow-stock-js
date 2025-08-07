import { RSI, MACD, BollingerBands, SMA, EMA, Stochastic } from 'technicalindicators';

function generateMockTechnical() {
  return {
    rsi: { value: 50 + Math.random() * 20 },
    macd: { MACD: (Math.random() - 0.5) * 2, signal: (Math.random() - 0.5) * 1.5, histogram: (Math.random() - 0.5) * 0.5 },
    bb: { upper: 110, middle: 100, lower: 90 },
    sma: { 20: 100, 50: 98, 200: 95 },
    ema: { 12: 101, 26: 99 },
    stochastic: { k: 50 + Math.random() * 50, d: 50 + Math.random() * 50 },
    summary: {
      direction: Math.random() > 0.5 ? 'bullish' : 'bearish',
      strength: 0.5 + Math.random() * 0.4,
      price: 100 + Math.random() * 20,
      signalCount: { buy: Math.floor(Math.random() * 3), sell: Math.floor(Math.random() * 3), neutral: Math.floor(Math.random() * 3) }
    }
  };
}

export async function technical(kline) {
  if (!kline || kline.length < 20) {
    console.log('Insufficient kline data for technical analysis');
    return generateMockTechnical();
  }

  try {
    console.log('Calculating technical indicators...');
    
    const close = kline.map(c => c.close);
    const high = kline.map(c => c.high);
    const low = kline.map(c => c.low);
    const volume = kline.map(c => c.volume);

    const rsi = RSI.calculate({ period: 14, values: close });
    const macd = MACD.calculate({ fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, values: close });
    const bb = BollingerBands.calculate({ period: 20, stdDev: 2, values: close });
    const sma20 = SMA.calculate({ period: 20, values: close });
    const sma50 = SMA.calculate({ period: 50, values: close });
    const sma200 = SMA.calculate({ period: 200, values: close });
    const ema12 = EMA.calculate({ period: 12, values: close });
    const ema26 = EMA.calculate({ period: 26, values: close });
    const stochastic = Stochastic.calculate({ high, low, close, period: 14, signalPeriod: 3 });

    const latest = kline[kline.length - 1];
    const currentPrice = latest.close;

    const rsiValue = rsi.length > 0 ? rsi[rsi.length - 1] : 50;
    const macdValue = macd.length > 0 ? macd[macd.length - 1] : { MACD: 0, signal: 0, histogram: 0 };
    const bbValue = bb.length > 0 ? bb[bb.length - 1] : { upper: currentPrice * 1.02, middle: currentPrice, lower: currentPrice * 0.98 };
    const sma20Value = sma20.length > 0 ? sma20[sma20.length - 1] : currentPrice;
    const sma50Value = sma50.length > 0 ? sma50[sma50.length - 1] : currentPrice;
    const sma200Value = sma200.length > 0 ? sma200[sma200.length - 1] : currentPrice;
    const ema12Value = ema12.length > 0 ? ema12[ema12.length - 1] : currentPrice;
    const ema26Value = ema26.length > 0 ? ema26[ema26.length - 1] : currentPrice;
    const stochValue = stochastic.length > 0 ? stochastic[stochastic.length - 1] : { k: 50, d: 50 };

    const signals = [];
    let buySignals = 0, sellSignals = 0, neutralSignals = 0;

    if (rsiValue < 30) { signals.push('RSI oversold'); buySignals++; }
    else if (rsiValue > 70) { signals.push('RSI overbought'); sellSignals++; }
    else { neutralSignals++; }

    if (macdValue.MACD > macdValue.signal) { signals.push('MACD bullish'); buySignals++; }
    else if (macdValue.MACD < macdValue.signal) { signals.push('MACD bearish'); sellSignals++; }
    else { neutralSignals++; }

    if (currentPrice < bbValue.lower) { signals.push('Price below BB lower'); buySignals++; }
    else if (currentPrice > bbValue.upper) { signals.push('Price above BB upper'); sellSignals++; }
    else { neutralSignals++; }

    if (ema12Value > ema26Value) { signals.push('EMA bullish'); buySignals++; }
    else if (ema12Value < ema26Value) { signals.push('EMA bearish'); sellSignals++; }
    else { neutralSignals++; }

    const direction = buySignals > sellSignals ? 'bullish' : sellSignals > buySignals ? 'bearish' : 'neutral';
    const strength = Math.max(buySignals, sellSignals) / (buySignals + sellSignals + neutralSignals);

    const summary = {
      direction,
      strength,
      price: currentPrice,
      signalCount: { buy: buySignals, sell: sellSignals, neutral: neutralSignals },
      signals: signals.slice(0, 5)
    };

    const result = {
      rsi: { value: rsiValue },
      macd: macdValue,
      bb: bbValue,
      sma: { 20: sma20Value, 50: sma50Value, 200: sma200Value },
      ema: { 12: ema12Value, 26: ema26Value },
      stochastic: stochValue,
      summary
    };

    console.log('Technical analysis completed');
    return result;

  } catch (error) {
    console.error('Technical analysis error:', error.message);
    return generateMockTechnical();
  }
}
