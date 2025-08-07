import llmClient from '../utils/llm.js';
import MCTS from './mcts.js';
import { quickBacktest } from '../eval/backtestEval.js';
import fs from 'fs-extra';

class Optimizer {
  constructor(config = {}) {
    this.operators = config.operators;
    this.evaluator = config.evaluator || quickBacktest;
    this.symbol = config.symbol || 'AAPL';
    this.maxRounds = config.maxRounds || 15;
    this.mcts = new MCTS(this.operators, this.evaluator, config.mctsConfig);
    
    this.bestWorkflow = null;
    this.bestScore = 0;
    this.history = [];
  }

  async run() {
    console.log(`\n🚀 Starting AFlow Optimization for ${this.symbol}`);
    console.log(`Max rounds: ${this.maxRounds}`);
    
    // 初始化基础workflow
    let currentWorkflow = this.getInitialWorkflow();
    let currentScore = await this.evaluateWorkflow(currentWorkflow);
    
    this.bestWorkflow = currentWorkflow;
    this.bestScore = currentScore;
    
    console.log(`Initial workflow score: ${(currentScore * 100).toFixed(2)}%`);
    
    for (let round = 1; round <= this.maxRounds; round++) {
      console.log(`\n📊 Round ${round}/${this.maxRounds}`);
      
      try {
        // 步骤1: 搜索 - 使用MCTS探索workflow空间
        const searchedWorkflow = await this.search(currentWorkflow);
        
        // 步骤2: 生成 - 使用LLM生成改进的workflow
        const generatedWorkflow = await this.generate(searchedWorkflow, currentScore);
        
        // 步骤3: 评估 - 评估新workflow的性能
        const newScore = await this.evaluateWorkflow(generatedWorkflow);
        
        // 步骤4: 反馈 - 决定是否接受新workflow
        const accepted = await this.feedback(currentWorkflow, generatedWorkflow, currentScore, newScore);
        
        if (accepted) {
          currentWorkflow = generatedWorkflow;
          currentScore = newScore;
          
          if (newScore > this.bestScore) {
            this.bestWorkflow = generatedWorkflow;
            this.bestScore = newScore;
            console.log(`🎉 New best score: ${(newScore * 100).toFixed(2)}%`);
          }
        }
        
        // 记录历史
        this.history.push({
          round,
          score: currentScore,
          bestScore: this.bestScore,
          accepted,
          timestamp: new Date().toISOString()
        });
        
        console.log(`Round ${round} result: ${(currentScore * 100).toFixed(2)}% (best: ${(this.bestScore * 100).toFixed(2)}%)`);
        
      } catch (error) {
        console.error(`Round ${round} error:`, error.message);
        this.history.push({
          round,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // 保存最终结果
    await this.saveResults();
    
    console.log(`\n✅ Optimization completed!`);
    console.log(`Best score: ${(this.bestScore * 100).toFixed(2)}%`);
    
    return {
      workflow: this.bestWorkflow,
      score: this.bestScore,
      history: this.history
    };
  }

  async search(workflow) {
    console.log('🔍 Searching workflow space...');
    
    // 使用MCTS搜索
    const searchedWorkflow = await this.mcts.search(workflow, this.symbol);
    
    return searchedWorkflow;
  }

  async generate(workflow, currentScore) {
    console.log('🤖 Generating improved workflow...');
    
    const prompt = `
你是一个专业的量化交易workflow优化专家。请基于当前workflow和性能评分，生成一个改进的版本。

当前workflow代码：
\`\`\`javascript
${workflow}
\`\`\`

当前性能评分：${(currentScore * 100).toFixed(2)}%

可用的操作符：
${Object.keys(this.operators).join(', ')}

请分析当前workflow的不足，并提出具体的改进方案。改进可以包括：
1. 添加或移除分析节点
2. 优化数据流程
3. 改进预测逻辑
4. 增加错误处理
5. 优化性能

请返回改进后的完整workflow代码，用\`\`\`javascript包裹：

\`\`\`javascript
async function improvedWorkflow(ctx) {
  // 你的改进代码
}
\`\`\`
`;

    const systemPrompt = `你是一个专业的量化交易系统架构师，擅长优化交易策略workflow。请提供具体、可执行的改进方案。`;

    try {
      const response = await llmClient.callLLM(prompt, systemPrompt);
      
      // 提取JavaScript代码
      const codeMatch = response.match(/```javascript\s*([\s\S]*?)\s*```/);
      if (codeMatch) {
        return codeMatch[1].trim();
      }
      
      // 如果没有找到代码块，尝试直接解析
      return response.trim();
      
    } catch (error) {
      console.error('Generation error:', error.message);
      return workflow; // 返回原workflow
    }
  }

  async evaluateWorkflow(workflow) {
    try {
      // 创建可执行的workflow函数
      const workflowFunction = this.createWorkflowFunction(workflow);
      
      // 使用快速回测评估
      const score = await this.evaluator(workflowFunction, this.symbol, 30);
      
      return score;
    } catch (error) {
      console.error('Evaluation error:', error.message);
      return 0.5; // 返回中性分数
    }
  }

  async feedback(oldWorkflow, newWorkflow, oldScore, newScore) {
    console.log('🔄 Providing feedback...');
    
    const improvement = newScore - oldScore;
    const threshold = 0.02; // 2%的改进阈值
    
    if (improvement > threshold) {
      console.log(`✅ Accepting improvement: +${(improvement * 100).toFixed(2)}%`);
      return true;
    } else if (improvement > -threshold) {
      // 如果改进很小，随机决定是否接受（模拟退火）
      const probability = Math.exp(improvement / 0.1); // 温度参数
      const accepted = Math.random() < probability;
      console.log(`${accepted ? '✅' : '❌'} Small change ${accepted ? 'accepted' : 'rejected'}: ${(improvement * 100).toFixed(2)}%`);
      return accepted;
    } else {
      console.log(`❌ Rejecting degradation: ${(improvement * 100).toFixed(2)}%`);
      return false;
    }
  }

  createWorkflowFunction(workflowCode) {
    try {
      // 创建一个包含operators的上下文
      const context = { StockOperators: this.operators };
      
      // 将workflow代码包装在一个函数中
      const wrappedCode = `
        const StockOperators = this.StockOperators;
        ${workflowCode}
        return improvedWorkflow || workflow || async function(ctx) { return ctx; };
      `;
      
      // 创建函数
      const func = new Function('ctx', wrappedCode);
      
      // 返回绑定到上下文的函数
      return async (ctx) => {
        try {
          const workflowFunc = func.call(context, ctx);
          return await workflowFunc(ctx);
        } catch (error) {
          console.error('Workflow execution error:', error.message);
          return ctx;
        }
      };
      
    } catch (error) {
      console.error('Workflow function creation error:', error.message);
      // 返回一个默认的workflow函数
      return async (ctx) => {
        try {
          const result = await this.operators.LightAnalysis(ctx);
          return result;
        } catch (error) {
          return ctx;
        }
      };
    }
  }

  getInitialWorkflow() {
    return `
async function initialWorkflow(ctx) {
  // 基础技术分析workflow
  const { kline } = await StockOperators.FetchKline(ctx.symbol);
  const { tech } = await StockOperators.TechnicalAnalysis({ ...ctx, kline });
  const { prediction } = await StockOperators.GeneratePrediction({ ...ctx, kline, tech });
  
  return { ...ctx, kline, tech, prediction };
}`;
  }

  async saveResults() {
    const results = {
      symbol: this.symbol,
      bestWorkflow: this.bestWorkflow,
      bestScore: this.bestScore,
      history: this.history,
      timestamp: new Date().toISOString()
    };
    
    await fs.writeJson('storage/optimization_results.json', results, { spaces: 2 });
    console.log('💾 Results saved to storage/optimization_results.json');
  }
}

export default Optimizer;
