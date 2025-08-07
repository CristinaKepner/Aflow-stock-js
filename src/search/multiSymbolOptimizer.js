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
    console.log(`🚀 Starting Multi-Symbol Optimization`);
    console.log(`📊 Symbols: ${this.symbols.join(', ')}`);
    console.log(`⚡ Max Concurrent: ${this.maxConcurrent}`);

    const batches = this.createBatches();
    let globalBestScore = 0;
    let globalBestWorkflow = null;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\n🔄 Processing batch ${i + 1}/${batches.length}: ${batch.join(', ')}`);

      const batchPromises = batch.map(symbol => this.optimizeSymbol(symbol));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        const symbol = batch[index];
        if (result.status === 'fulfilled') {
          this.results.set(symbol, result.value);
          if (result.value.score > globalBestScore) {
            globalBestScore = result.value.score;
            globalBestWorkflow = result.value.workflow;
          }
          console.log(`✅ ${symbol}: ${(result.value.score * 100).toFixed(2)}%`);
        } else {
          console.log(`❌ ${symbol}: Failed - ${result.reason.message}`);
        }
      });
    }

    this.saveResults(globalBestScore, globalBestWorkflow);

    return {
      globalBestScore,
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
      individualResults: Object.fromEntries(this.results),
      timestamp: new Date().toISOString()
    };

    writeFileSync('storage/multi_symbol_results.json', JSON.stringify(results, null, 2));
    console.log('💾 Multi-symbol results saved to storage/multi_symbol_results.json');
  }
}
