export class MCTS {
  constructor(config) {
    this.operators = config.operators;
    this.evaluator = config.evaluator;
    this.symbol = config.symbol;
    this.root = new MCTSNode('LightAnalysis', null);
  }

  async search(iterations = 10) {
    for (let i = 0; i < iterations; i++) {
      const node = this.select(this.root);
      const child = this.expand(node);
      const score = await this.simulate(child);
      this.backpropagate(child, score);
    }

    const bestChild = this.root.children.reduce((best, child) => 
      child.visits > 0 && child.score > best.score ? child : best, 
      this.root.children[0] || this.root
    );

    return {
      workflow: bestChild.workflow,
      score: bestChild.score
    };
  }

  select(node) {
    while (node.children.length > 0) {
      node = node.children.reduce((best, child) => {
        const ucb1 = child.score + Math.sqrt(2 * Math.log(node.visits) / child.visits);
        const bestUcb1 = best.score + Math.sqrt(2 * Math.log(node.visits) / best.visits);
        return ucb1 > bestUcb1 ? child : best;
      });
    }
    return node;
  }

  expand(node) {
    const workflowNames = Object.keys(this.operators);
    const availableWorkflows = workflowNames.filter(name => 
      !node.children.some(child => child.workflow === name)
    );

    if (availableWorkflows.length === 0) {
      return node;
    }

    const randomWorkflow = availableWorkflows[Math.floor(Math.random() * availableWorkflows.length)];
    const child = new MCTSNode(randomWorkflow, node);
    node.children.push(child);
    return child;
  }

  async simulate(node) {
    try {
      const score = await this.evaluator(node.workflow, this.symbol);
      return score;
    } catch (error) {
      return 0.5;
    }
  }

  backpropagate(node, score) {
    while (node) {
      node.visits++;
      node.score = (node.score * (node.visits - 1) + score) / node.visits;
      node = node.parent;
    }
  }
}

class MCTSNode {
  constructor(workflow, parent) {
    this.workflow = workflow;
    this.parent = parent;
    this.children = [];
    this.visits = 0;
    this.score = 0;
  }
}
