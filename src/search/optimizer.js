import { MCTS } from './mcts.js';
import { llmClient } from '../utils/llm.js';
import { writeFileSync } from 'fs';

export class Optimizer {
  constructor(config) {
    this.operators = config.operators;
    this.evaluator = config.evaluator;
    this.symbol = config.symbol || 'AAPL';
    this.maxRounds = config.maxRounds || 5;
    this.bestScore = 0;
    this.bestWorkflow = null;
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
      history: this.history
    };
  }

  async generateImprovedWorkflow(currentWorkflow) {
    console.log('🤖 Generating improved workflow...');
    
    const prompt = `当前工作流：
${currentWorkflow || 'LightAnalysis'}

请生成一个改进的股票分析工作流，使用以下操作符：
${Object.keys(this.operators).join(', ')}

返回一个简单的函数名，如：LightAnalysis 或 FullAnalysis`;

    const systemPrompt = '你是一个工作流优化专家，请基于当前工作流生成改进版本。';

    try {
      const response = await llmClient.callLLM(prompt, systemPrompt);
      if (response) {
        const workflowName = response.trim().replace(/[^a-zA-Z]/g, '');
        if (this.operators[workflowName]) {
          return workflowName;
        }
      }
    } catch (error) {
      console.error('Workflow generation error:', error.message);
    }

    return 'LightAnalysis';
  }

  async evaluateWorkflow(workflow) {
    try {
      return await this.evaluator(workflow, this.symbol);
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
      history: this.history,
      timestamp: new Date().toISOString()
    };

    writeFileSync('storage/optimization_results.json', JSON.stringify(results, null, 2));
    console.log('💾 Results saved to storage/optimization_results.json');
  }
}
