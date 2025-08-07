import 'dotenv/config';
import { Optimizer } from '../src/search/optimizer.js';
import { backtestEval } from '../src/eval/backtestEval.js';
import { StockOperators } from '../src/operators/stockOperators.js';
import { writeFileSync } from 'fs';

async function runExample() {
  console.log('🚀 Starting AFlow Stock Analysis Example');
  console.log('📊 Symbol: AAPL');
  console.log('⏱️  Max rounds: 5');
  
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.log('⚠️  No LLM API keys configured. Using mock data for predictions.');
  }

  const optimizer = new Optimizer({
    operators: StockOperators,
    evaluator: backtestEval,
    symbol: 'AAPL',
    maxRounds: 5
  });

  const result = await optimizer.run();

  console.log('\n✅ Optimization completed!');
  console.log(`Best score: ${(result.score * 100).toFixed(2)}%`);
  console.log('\n🎉 Optimization Results');
  console.log('======================');
  console.log(`Symbol: AAPL`);
  console.log(`Best Score: ${(result.score * 100).toFixed(2)}%`);
  console.log(`Total Time: ${Date.now() - startTime}s`);
  console.log(`Rounds Completed: ${result.history.length}`);

  console.log('\n🏆 Best Workflow:');
  console.log('================');
  console.log(result.workflow || 'LightAnalysis');

  console.log('\n📊 Optimization History:');
  console.log('=======================');
  result.history.forEach((round, index) => {
    const status = round.improvement > 0 ? '✅' : '❌';
    console.log(`Round ${index + 1}: ${(round.score * 100).toFixed(2)}% (best: ${(result.score * 100).toFixed(2)}%) ${status}`);
  });

  console.log('\n🔍 Running Final Backtest...');
  const finalScore = await backtestEval(result.workflow, 'AAPL', 60);
  console.log(`Final Backtest Score: ${(finalScore * 100).toFixed(2)}%`);

  const exampleResults = {
    symbol: 'AAPL',
    bestScore: result.score,
    bestWorkflow: result.workflow,
    optimizationHistory: result.history,
    finalBacktestScore: finalScore,
    timestamp: new Date().toISOString()
  };

  writeFileSync('storage/example_results.json', JSON.stringify(exampleResults, null, 2));
  console.log('\n💾 Detailed results saved to storage/example_results.json');

  console.log('\n✅ Example completed successfully!');
  console.log('\n📝 Next Steps:');
  console.log('1. Check storage/optimization_results.json for optimization details');
  console.log('2. Check storage/example_results.json for complete results');
  console.log('3. Modify .env file to use real LLM APIs for better results');
  console.log('4. Try different symbols or increase maxRounds for more thorough optimization');
}

const startTime = Date.now();
runExample().catch(console.error);
