import 'dotenv/config';
import Optimizer from '../src/search/optimizer.js';
import { StockOperators } from '../src/operators/stockOperators.js';
import { backtestEval } from '../src/eval/backtestEval.js';
import fs from 'fs-extra';

async function runExample() {
  console.log('🎯 AFlow Stock Trading Workflow Optimization');
  console.log('=============================================\n');

  try {
    // 检查环境变量
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      console.log('⚠️  No LLM API key found. Using mock data for demonstration.');
      console.log('   To use real LLM features, set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env file\n');
    }

    // 配置优化器
    const config = {
      operators: StockOperators,
      evaluator: backtestEval,
      symbol: process.env.DEFAULT_SYMBOL || 'AAPL',
      maxRounds: parseInt(process.env.MAX_SEARCH_ROUNDS) || 5, // 减少轮数用于演示
      mctsConfig: {
        maxIterations: 20, // 减少迭代次数用于演示
        explorationConstant: 1.414
      }
    };

    console.log(`📈 Target Symbol: ${config.symbol}`);
    console.log(`🔄 Max Optimization Rounds: ${config.maxRounds}`);
    console.log(`🎲 MCTS Iterations: ${config.mctsConfig.maxIterations}\n`);

    // 创建优化器
    const optimizer = new Optimizer(config);

    // 运行优化
    const startTime = Date.now();
    const result = await optimizer.run();
    const endTime = Date.now();

    // 显示结果
    console.log('\n🎉 Optimization Results');
    console.log('======================');
    console.log(`Symbol: ${config.symbol}`);
    console.log(`Best Score: ${(result.score * 100).toFixed(2)}%`);
    console.log(`Total Time: ${((endTime - startTime) / 1000).toFixed(1)}s`);
    console.log(`Rounds Completed: ${result.history.length}`);

    // 显示最佳workflow
    console.log('\n🏆 Best Workflow:');
    console.log('================');
    console.log(result.workflow);

    // 显示历史记录
    console.log('\n📊 Optimization History:');
    console.log('=======================');
    result.history.forEach((record, index) => {
      if (record.error) {
        console.log(`Round ${record.round}: ERROR - ${record.error}`);
      } else {
        console.log(`Round ${record.round}: ${(record.score * 100).toFixed(2)}% (best: ${(record.bestScore * 100).toFixed(2)}%) ${record.accepted ? '✅' : '❌'}`);
      }
    });

    // 运行最终回测
    console.log('\n🔍 Running Final Backtest...');
    try {
      const finalScore = await backtestEval(
        optimizer.createWorkflowFunction(result.workflow),
        config.symbol,
        60
      );
      console.log(`Final Backtest Score: ${(finalScore * 100).toFixed(2)}%`);
    } catch (error) {
      console.error('Final backtest error:', error.message);
    }

    // 保存详细结果
    const detailedResults = {
      config,
      result,
      executionTime: endTime - startTime,
      timestamp: new Date().toISOString()
    };

    await fs.writeJson('storage/example_results.json', detailedResults, { spaces: 2 });
    console.log('\n💾 Detailed results saved to storage/example_results.json');

    console.log('\n✅ Example completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Check storage/optimization_results.json for optimization details');
    console.log('2. Check storage/example_results.json for complete results');
    console.log('3. Modify .env file to use real LLM APIs for better results');
    console.log('4. Try different symbols or increase maxRounds for more thorough optimization');

  } catch (error) {
    console.error('\n❌ Example failed:', error.message);
    console.error(error.stack);
    
    // 保存错误信息
    await fs.writeJson('storage/error_log.json', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { spaces: 2 });
  }
}

// 运行示例
runExample().catch(console.error);
