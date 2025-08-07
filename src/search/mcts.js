class MCTSNode {
  constructor(workflow, parent = null, action = null) {
    this.workflow = workflow;
    this.parent = parent;
    this.action = action;
    this.children = [];
    this.visits = 0;
    this.score = 0;
    this.ucb = 0;
  }

  addChild(workflow, action) {
    const child = new MCTSNode(workflow, this, action);
    this.children.push(child);
    return child;
  }

  update(score) {
    this.visits++;
    this.score += score;
  }

  calculateUCB(explorationConstant = 1.414) {
    if (this.visits === 0) return Infinity;
    
    const exploitation = this.score / this.visits;
    const exploration = explorationConstant * Math.sqrt(Math.log(this.parent.visits) / this.visits);
    this.ucb = exploitation + exploration;
    return this.ucb;
  }

  isFullyExpanded() {
    return this.children.length >= this.getPossibleActions().length;
  }

  getPossibleActions() {
    // 返回可能的workflow修改动作
    return [
      'add_technical_analysis',
      'add_sentiment_analysis',
      'add_news_fetch',
      'modify_prompt',
      'change_confidence_threshold',
      'add_ensemble',
      'remove_node',
      'reorder_nodes'
    ];
  }

  isTerminal() {
    // 检查是否达到终止条件
    return this.visits >= 10; // 每个节点至少访问10次
  }
}

class MCTS {
  constructor(operators, evaluator, config = {}) {
    this.operators = operators;
    this.evaluator = evaluator;
    this.config = {
      maxIterations: config.maxIterations || 100,
      explorationConstant: config.explorationConstant || 1.414,
      simulationDepth: config.simulationDepth || 5,
      ...config
    };
  }

  async search(initialWorkflow, symbol = 'AAPL') {
    console.log('Starting MCTS search...');
    
    const root = new MCTSNode(initialWorkflow);
    
    for (let i = 0; i < this.config.maxIterations; i++) {
      console.log(`MCTS iteration ${i + 1}/${this.config.maxIterations}`);
      
      // 选择
      const selectedNode = this.select(root);
      
      // 扩展
      const expandedNode = this.expand(selectedNode);
      
      // 模拟
      const score = await this.simulate(expandedNode, symbol);
      
      // 反向传播
      this.backpropagate(expandedNode, score);
    }

    // 返回最佳子节点
    const bestChild = this.getBestChild(root);
    console.log(`MCTS search completed. Best score: ${bestChild.score / bestChild.visits}`);
    
    return bestChild.workflow;
  }

  select(node) {
    while (!node.isTerminal() && node.isFullyExpanded()) {
      node = this.getBestChild(node);
    }
    return node;
  }

  expand(node) {
    if (node.isTerminal()) {
      return node;
    }

    const possibleActions = node.getPossibleActions();
    const unexpandedActions = possibleActions.filter(action => 
      !node.children.some(child => child.action === action)
    );

    if (unexpandedActions.length === 0) {
      return node;
    }

    const action = unexpandedActions[Math.floor(Math.random() * unexpandedActions.length)];
    const newWorkflow = this.applyAction(node.workflow, action);
    const child = node.addChild(newWorkflow, action);

    return child;
  }

  async simulate(node, symbol) {
    try {
      // 使用快速回测进行模拟
      const score = await this.evaluator(node.workflow, symbol, 30);
      return score;
    } catch (error) {
      console.error('Simulation error:', error.message);
      return 0.5; // 返回中性分数
    }
  }

  backpropagate(node, score) {
    while (node !== null) {
      node.update(score);
      node = node.parent;
    }
  }

  getBestChild(node) {
    if (node.children.length === 0) {
      return node;
    }

    // 计算所有子节点的UCB值
    node.children.forEach(child => child.calculateUCB(this.config.explorationConstant));
    
    // 返回UCB值最高的子节点
    return node.children.reduce((best, child) => 
      child.ucb > best.ucb ? child : best
    );
  }

  applyAction(workflow, action) {
    // 根据动作修改workflow
    switch (action) {
      case 'add_technical_analysis':
        return this.addTechnicalAnalysis(workflow);
      case 'add_sentiment_analysis':
        return this.addSentimentAnalysis(workflow);
      case 'add_news_fetch':
        return this.addNewsFetch(workflow);
      case 'modify_prompt':
        return this.modifyPrompt(workflow);
      case 'change_confidence_threshold':
        return this.changeConfidenceThreshold(workflow);
      case 'add_ensemble':
        return this.addEnsemble(workflow);
      case 'remove_node':
        return this.removeNode(workflow);
      case 'reorder_nodes':
        return this.reorderNodes(workflow);
      default:
        return workflow;
    }
  }

  addTechnicalAnalysis(workflow) {
    // 添加技术分析节点
    const newWorkflow = `
async function enhancedWorkflow(ctx) {
  ${workflow}
  
  // 添加技术分析
  if (!ctx.tech) {
    const { tech } = await this.operators.TechnicalAnalysis(ctx);
    ctx = { ...ctx, tech };
  }
  
  return ctx;
}`;
    return newWorkflow;
  }

  addSentimentAnalysis(workflow) {
    // 添加情感分析节点
    const newWorkflow = `
async function enhancedWorkflow(ctx) {
  ${workflow}
  
  // 添加情感分析
  if (!ctx.sentiment) {
    const { sentiment } = await this.operators.SentimentAnalysis(ctx);
    ctx = { ...ctx, sentiment };
  }
  
  return ctx;
}`;
    return newWorkflow;
  }

  addNewsFetch(workflow) {
    // 添加新闻获取节点
    const newWorkflow = `
async function enhancedWorkflow(ctx) {
  ${workflow}
  
  // 添加新闻获取
  if (!ctx.news) {
    const { news } = await this.operators.FetchNews(ctx);
    ctx = { ...ctx, news };
  }
  
  return ctx;
}`;
    return newWorkflow;
  }

  modifyPrompt(workflow) {
    // 修改提示词（简化实现）
    return workflow.replace(
      /请基于以下数据生成明日交易信号/g,
      '请基于以下多维度数据综合分析，生成高置信度的明日交易信号'
    );
  }

  changeConfidenceThreshold(workflow) {
    // 修改置信度阈值（简化实现）
    return workflow.replace(
      /confidence": 0\.85/g,
      'confidence": 0.75'
    );
  }

  addEnsemble(workflow) {
    // 添加集成学习（简化实现）
    return `
async function ensembleWorkflow(ctx) {
  // 运行多个workflow并集成结果
  const result1 = await (${workflow})(ctx);
  const result2 = await this.operators.LightAnalysis(ctx);
  
  // 简单集成：取平均置信度
  const avgConfidence = (result1.prediction.confidence + result2.prediction.confidence) / 2;
  
  return {
    ...result1,
    prediction: {
      ...result1.prediction,
      confidence: avgConfidence
    }
  };
}`;
  }

  removeNode(workflow) {
    // 移除节点（简化实现）
    return workflow.replace(
      /const \{ sentiment \} = await this\.operators\.SentimentAnalysis\(ctx\);/g,
      '// Sentiment analysis removed for optimization'
    );
  }

  reorderNodes(workflow) {
    // 重新排序节点（简化实现）
    return workflow.replace(
      /const \{ kline \} = await this\.operators\.FetchKline\(ctx\.symbol\);\s*const \{ tech \} = await this\.operators\.TechnicalAnalysis\(\{ \.\.\.ctx, kline \}\);/g,
      `const { tech } = await this.operators.TechnicalAnalysis(ctx);
const { kline } = await this.operators.FetchKline(ctx.symbol);`
    );
  }
}

export default MCTS;
