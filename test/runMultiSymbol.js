import 'dotenv/config';
import MultiSymbolOptimizer from '../src/search/multiSymbolOptimizer.js';
import { StockOperators } from '../src/operators/stockOperators.js';
import { backtestEval } from '../src/eval/backtestEval.js';

async function runMultiSymbolExample() {
  console.log('🎯 AFlow Multi-Symbol Parallel Optimization');
  console.log('===========================================\n');

  try {
    // 配置多标的优化器
    const config = {
      operators: StockOperators,
      evaluator: backtestEval,
      symbols: ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN'],
      maxRounds: 3, // 每个符号3轮优化
      maxConcurrent: 2, // 最多2个符号并行
    };

    console.log(`📈 Target Symbols: ${config.symbols.join(', ')}`);
    console.log(`🔄 Max Rounds per Symbol: ${config.maxRounds}`);
    console.log(`⚡ Max Concurrent: ${config.maxConcurrent}\n`);

    // 创建多标的优化器
    const optimizer = new MultiSymbolOptimizer(config);

    // 运行优化
    const startTime = Date.now();
    const result = await optimizer.run();
    const endTime = Date.now();

    // 显示结果
    console.log('\n🎉 Multi-Symbol Optimization Results');
    console.log('===================================');
    console.log(`Total Time: ${((endTime - startTime) / 1000).toFixed(1)}s`);
    console.log(`Successful Symbols: ${result.successfulCount}/${result.symbols.length}`);
    console.log(`Average Score: ${(result.averageScore * 100).toFixed(2)}%`);
    console.log(`Global Best Score: ${(result.globalBestScore * 100).toFixed(2)}%`);

    // 显示每个符号的结果
    console.log('\n📊 Individual Symbol Results:');
    console.log('============================');
    result.successfulResults.forEach(symbolResult => {
      console.log(`${symbolResult.symbol}: ${(symbolResult.score * 100).toFixed(2)}%`);
    });

    if (result.failedResults.length > 0) {
      console.log('\n❌ Failed Symbols:');
      console.log('==================');
      result.failedResults.forEach(failedResult => {
        console.log(`${failedResult.symbol}: ${failedResult.error}`);
      });
    }

    // 显示最佳结果
    if (result.bestResult) {
      console.log('\n🏆 Best Performing Symbol:');
      console.log('=========================');
      console.log(`Symbol: ${result.bestResult.symbol}`);
      console.log(`Score: ${(result.bestResult.score * 100).toFixed(2)}%`);
      console.log(`Workflow: ${result.bestResult.workflow.substring(0, 100)}...`);
    }

    // 显示全局最佳workflow
    console.log('\n🌍 Global Best Workflow:');
    console.log('=======================');
    console.log(result.globalBestWorkflow);

    console.log('\n✅ Multi-symbol optimization completed successfully!');

  } catch (error) {
    console.error('\n❌ Multi-symbol optimization failed:', error.message);
    console.error(error.stack);
  }
}

// 运行示例
runMultiSymbolExample().catch(console.error);
