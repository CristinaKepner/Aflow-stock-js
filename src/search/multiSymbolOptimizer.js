import { Optimizer } from './optimizer.js';
import { writeFileSync } from 'fs';

export class MultiSymbolOptimizer {
  constructor(config) {
    this.operators = config.operators;
    this.evaluator = config.evaluator;
    this.symbols = config.symbols || ['AAPL', 'GOOGL', 'MSFT'];
    this.maxConcurrent = config.maxConcurrent || 3;
    this.results = new Map();
  }

  async run() {
    const startTime = Date.now();
    console.log(`🚀 Starting Multi-Symbol Optimization`);
    console.log(`📊 Symbols: ${this.symbols.join(', ')}`);
    console.log(`⚡ Max Concurrent: ${this.maxConcurrent}`);

    const batches = this.createBatches();
    let globalBestScore = 0;
    let globalBestWorkflow = null;
    let globalBestSymbol = null;
    const allResults = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\n🔄 Processing batch ${i + 1}/${batches.length}: ${batch.join(', ')}`);

      const batchPromises = batch.map(symbol => this.optimizeSymbol(symbol));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        const symbol = batch[index];
        allResults.push(result);
        
        if (result.status === 'fulfilled') {
          this.results.set(symbol, result.value);
          if (result.value.score > globalBestScore) {
            globalBestScore = result.value.score;
            globalBestWorkflow = result.value.workflow;
            globalBestSymbol = symbol;
          }
          console.log(`✅ ${symbol}: ${(result.value.score * 100).toFixed(2)}%`);
        } else {
          console.log(`❌ ${symbol}: Failed - ${result.reason?.message || 'Unknown error'}`);
        }
      });
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const successfulResults = allResults.filter(r => r.status === 'fulfilled');
    const successfulSymbols = successfulResults.length;
    const averageScore = successfulResults.length > 0 
      ? successfulResults.reduce((sum, r) => sum + r.value.score, 0) / successfulResults.length 
      : 0;

    this.saveResults(globalBestScore, globalBestWorkflow);

    return {
      results: allResults,
      totalTime,
      successfulSymbols,
      averageScore,
      globalBestScore,
      globalBestSymbol,
      globalBestWorkflow,
      individualResults: Object.fromEntries(this.results)
    };
  }

  createBatches() {
    const batches = [];
    for (let i = 0; i < this.symbols.length; i += this.maxConcurrent) {
      batches.push(this.symbols.slice(i, i + this.maxConcurrent));
    }
    return batches;
  }

  async optimizeSymbol(symbol) {
    const optimizer = new Optimizer({
      operators: this.operators,
      evaluator: this.evaluator,
      symbol,
      maxRounds: 3
    });

    return await optimizer.run();
  }

  saveResults(globalBestScore, globalBestWorkflow) {
    const results = {
      symbols: this.symbols,
      globalBestScore,
      globalBestWorkflow,
      globalBestWorkflowDSL: this.getWorkflowDSL(globalBestWorkflow),
      individualResults: Object.fromEntries(
        Array.from(this.results.entries()).map(([symbol, result]) => [
          symbol,
          {
            score: result.score,
            workflow: result.workflow,
            workflowDSL: this.getWorkflowDSL(result.workflow),
            history: result.history
          }
        ])
      ),
      timestamp: new Date().toISOString()
    };

    writeFileSync('storage/multi_symbol_results.json', JSON.stringify(results, null, 2));
    console.log('💾 Multi-symbol results saved to storage/multi_symbol_results.json');
  }

  getWorkflowDSL(workflowName) {
    const WorkflowDSL = {
      LightAnalysis: {
        name: "LightAnalysis",
        description: "轻量级技术分析工作流",
        nodes: [
          {
            id: "fetch_kline",
            type: "fetchKline",
            config: { symbol: "{{symbol}}" },
            outputs: ["kline"]
          },
          {
            id: "technical_analysis",
            type: "technical",
            config: { indicators: ["rsi", "macd", "bb"] },
            inputs: ["kline"],
            outputs: ["tech"]
          },
          {
            id: "prediction",
            type: "predict",
            config: { model: "simple_ml" },
            inputs: ["kline", "tech"],
            outputs: ["prediction"]
          }
        ],
        edges: [
          { from: "fetch_kline", to: "technical_analysis", data: "kline" },
          { from: "technical_analysis", to: "prediction", data: "tech" },
          { from: "fetch_kline", to: "prediction", data: "kline" }
        ]
      },
      
      FullAnalysis: {
        name: "FullAnalysis",
        description: "完整分析工作流（技术+新闻+情感）",
        nodes: [
          {
            id: "fetch_kline",
            type: "fetchKline",
            config: { symbol: "{{symbol}}" },
            outputs: ["kline"]
          },
          {
            id: "technical_analysis",
            type: "technical",
            config: { indicators: ["rsi", "macd", "bb", "ema"] },
            inputs: ["kline"],
            outputs: ["tech"]
          },
          {
            id: "fetch_news",
            type: "news",
            config: { symbol: "{{symbol}}", days: 7 },
            outputs: ["news"]
          },
          {
            id: "sentiment_analysis",
            type: "sentiment",
            config: { model: "finbert" },
            inputs: ["news"],
            outputs: ["sentiment"]
          },
          {
            id: "prediction",
            type: "predict",
            config: { model: "ensemble_ml" },
            inputs: ["kline", "tech", "sentiment", "news"],
            outputs: ["prediction"]
          }
        ],
        edges: [
          { from: "fetch_kline", to: "technical_analysis", data: "kline" },
          { from: "fetch_news", to: "sentiment_analysis", data: "news" },
          { from: "technical_analysis", to: "prediction", data: "tech" },
          { from: "sentiment_analysis", to: "prediction", data: "sentiment" },
          { from: "fetch_kline", to: "prediction", data: "kline" },
          { from: "fetch_news", to: "prediction", data: "news" }
        ]
      },
      
      TechnicalAnalysis: {
        name: "TechnicalAnalysis",
        description: "纯技术分析工作流",
        nodes: [
          {
            id: "fetch_kline",
            type: "fetchKline",
            config: { symbol: "{{symbol}}" },
            outputs: ["kline"]
          },
          {
            id: "technical_analysis",
            type: "technical",
            config: { indicators: ["rsi", "macd", "bb", "ema", "stoch"] },
            inputs: ["kline"],
            outputs: ["tech"]
          },
          {
            id: "prediction",
            type: "predict",
            config: { model: "technical_ml" },
            inputs: ["kline", "tech"],
            outputs: ["prediction"]
          }
        ],
        edges: [
          { from: "fetch_kline", to: "technical_analysis", data: "kline" },
          { from: "technical_analysis", to: "prediction", data: "tech" },
          { from: "fetch_kline", to: "prediction", data: "kline" }
        ]
      },
      
      NewsSentiment: {
        name: "NewsSentiment",
        description: "新闻情感分析工作流",
        nodes: [
          {
            id: "fetch_news",
            type: "news",
            config: { symbol: "{{symbol}}", days: 14 },
            outputs: ["news"]
          },
          {
            id: "sentiment_analysis",
            type: "sentiment",
            config: { model: "finbert", threshold: 0.6 },
            inputs: ["news"],
            outputs: ["sentiment"]
          },
          {
            id: "prediction",
            type: "predict",
            config: { model: "sentiment_ml" },
            inputs: ["sentiment", "news"],
            outputs: ["prediction"]
          }
        ],
        edges: [
          { from: "fetch_news", to: "sentiment_analysis", data: "news" },
          { from: "sentiment_analysis", to: "prediction", data: "sentiment" },
          { from: "fetch_news", to: "prediction", data: "news" }
        ]
      },
      
      SentimentDriven: {
        name: "SentimentDriven",
        description: "情感驱动工作流（放大情感影响）",
        nodes: [
          {
            id: "fetch_news",
            type: "news",
            config: { symbol: "{{symbol}}", days: 21 },
            outputs: ["news"]
          },
          {
            id: "sentiment_analysis",
            type: "sentiment",
            config: { model: "finbert", amplification: 1.2 },
            inputs: ["news"],
            outputs: ["sentiment"]
          },
          {
            id: "prediction",
            type: "predict",
            config: { model: "sentiment_weighted" },
            inputs: ["sentiment", "news"],
            outputs: ["prediction"]
          }
        ],
        edges: [
          { from: "fetch_news", to: "sentiment_analysis", data: "news" },
          { from: "sentiment_analysis", to: "prediction", data: "sentiment" },
          { from: "fetch_news", to: "prediction", data: "news" }
        ]
      }
    };

    const dsl = WorkflowDSL[workflowName];
    if (!dsl) {
      return {
        name: workflowName,
        description: "Unknown workflow",
        nodes: [],
        edges: []
      };
    }
    
    // 返回通用DSL，不替换symbol（因为这是全局结果）
    return JSON.parse(JSON.stringify(dsl));
  }
}
