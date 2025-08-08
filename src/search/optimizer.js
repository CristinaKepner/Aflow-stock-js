import { MCTS } from './mcts.js';
import { llmClient } from '../utils/llm.js';
import { writeFileSync } from 'fs';

// Workflow DSL定义
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

export class Optimizer {
  constructor(config) {
    this.operators = config.operators;
    this.evaluator = config.evaluator;
    this.symbol = config.symbol || 'AAPL';
    this.maxRounds = config.maxRounds || 5;
    this.bestScore = 0;
    this.bestWorkflow = null;
    this.bestWorkflowDSL = null;
    this.history = [];
  }

  async run() {
    console.log(`🚀 Starting AFlow optimization for ${this.symbol}`);
    console.log(`📊 Max rounds: ${this.maxRounds}`);
    
    const mcts = new MCTS({
      operators: this.operators,
      evaluator: this.evaluator,
      symbol: this.symbol
    });

    for (let round = 1; round <= this.maxRounds; round++) {
      console.log(`\n🔄 Round ${round}/${this.maxRounds}`);
      
      const searchResult = await mcts.search(3);
      const searchScore = searchResult.score || 0;
      
      console.log(`🔍 MCTS search completed. Best score: ${searchScore}`);
      
      const improvedWorkflow = await this.generateImprovedWorkflow(searchResult.workflow);
      
      if (improvedWorkflow) {
        const score = await this.evaluateWorkflow(improvedWorkflow);
        const improvement = score - this.bestScore;
        
        if (improvement > 0) {
          this.bestScore = score;
          this.bestWorkflow = improvedWorkflow;
          this.bestWorkflowDSL = this.getWorkflowDSL(improvedWorkflow);
          console.log(`✅ Improvement accepted: ${(improvement * 100).toFixed(2)}%`);
        } else {
          console.log(`❌ Improvement rejected: ${(improvement * 100).toFixed(2)}%`);
        }
        
        this.history.push({ round, score, improvement });
        console.log(`Round ${round} result: ${(score * 100).toFixed(2)}% (best: ${(this.bestScore * 100).toFixed(2)}%)`);
      }
    }

    this.saveResults();
    return {
      score: this.bestScore,
      workflow: this.bestWorkflow,
      workflowDSL: this.bestWorkflowDSL,
      history: this.history
    };
  }

  getWorkflowDSL(workflowName) {
    const dsl = WorkflowDSL[workflowName];
    if (!dsl) {
      return {
        name: workflowName,
        description: "Unknown workflow",
        nodes: [],
        edges: []
      };
    }
    
    // 替换模板变量
    const dslCopy = JSON.parse(JSON.stringify(dsl));
    const replaceTemplate = (obj) => {
      if (typeof obj === 'string') {
        return obj.replace(/\{\{symbol\}\}/g, this.symbol);
      } else if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          obj[key] = replaceTemplate(obj[key]);
        }
      }
      return obj;
    };
    
    return replaceTemplate(dslCopy);
  }

    async generateImprovedWorkflow(currentWorkflow) {
    console.log('🤖 Generating improved workflow...');

    const shouldUseLLM = Math.random() < 0.3;
    
    if (shouldUseLLM) {
      const prompt = `当前工作流：${currentWorkflow || 'LightAnalysis'}

请从以下选项中选择一个改进的工作流：
${Object.keys(this.operators).join(', ')}

只返回一个函数名。`;

      const systemPrompt = '你是一个工作流优化专家，请选择一个更好的工作流。';

      try {
        const response = await llmClient.callLLM(prompt, systemPrompt, 1);
        if (response) {
          const workflowName = response.trim().replace(/[^a-zA-Z]/g, '');
          if (this.operators[workflowName]) {
            console.log(`🤖 LLM suggested: ${workflowName}`);
            return workflowName;
          }
        }
      } catch (error) {
        console.log('🔄 LLM unavailable, using smart fallback');
      }
    } else {
      console.log('💡 Using smart strategy to reduce API calls');
    }

    // 智能工作流选择：基于当前性能和符号特性
    const workflows = ['LightAnalysis', 'FullAnalysis', 'NewsSentiment', 'TechnicalAnalysis', 'SentimentDriven'];
    const symbolWorkflowPreference = {
      'AAPL': ['FullAnalysis', 'TechnicalAnalysis', 'NewsSentiment'],
      'TSLA': ['SentimentDriven', 'NewsSentiment', 'FullAnalysis'], 
      'GOOGL': ['TechnicalAnalysis', 'FullAnalysis', 'LightAnalysis'],
      'MSFT': ['FullAnalysis', 'TechnicalAnalysis', 'LightAnalysis'],
      'AMZN': ['NewsSentiment', 'FullAnalysis', 'SentimentDriven']
    };
    
    const preferred = symbolWorkflowPreference[this.symbol] || workflows;
    
    // 如果当前性能不好，尝试更复杂的工作流
    if (this.bestScore < 0.4) {
      return preferred.find(w => w.includes('Full') || w.includes('Sentiment')) || 'FullAnalysis';
    }
    
    // 如果性能还可以，尝试优化
    const currentIndex = preferred.indexOf(currentWorkflow);
    if (currentIndex >= 0 && currentIndex < preferred.length - 1) {
      return preferred[currentIndex + 1];
    }
    
    // 循环回到第一个
    return preferred[0];
  }

  async evaluateWorkflow(workflow) {
    try {
      return await this.evaluator(workflow, this.symbol, 10); // 使用10天的短期回测
    } catch (error) {
      console.error('Evaluation error:', error.message);
      return 0;
    }
  }

  saveResults() {
    const results = {
      symbol: this.symbol,
      bestScore: this.bestScore,
      bestWorkflow: this.bestWorkflow,
      workflowDSL: this.bestWorkflowDSL,
      history: this.history,
      timestamp: new Date().toISOString()
    };

    writeFileSync('storage/optimization_results.json', JSON.stringify(results, null, 2));
    console.log('💾 Results saved to storage/optimization_results.json');
  }
}
