# AFlow Stock Trading Workflow Optimization

**一句话总结：**  
AFlow 就像一个“自动炼丹炉”，你给它一个问题（比如数学题、写代码、回答问题），它就能自己摸索出一套最有效的“解题步骤”，而且这个步骤比人类专家设计的还要好。

---

### 1. 为什么要搞 AFlow？

你有没有发现，现在大模型（比如 GPT-4）虽然厉害，但想要它真正解决复杂问题，你得一步一步教它怎么做，比如：

- 数学题：你得告诉它“先理解题意，再列方程，再计算，再检查”。
- 写代码：你得告诉它“先理解需求，再写代码，再测试，再修 bug”。

这些“解题步骤”就是所谓的 **Agentic Workflow**（智能体工作流程）。  
但问题是：**这些流程现在都是人类专家手动设计的，费时费力，而且换个任务就不一定好使了。**

所以，AFlow 就想：**能不能让 AI 自己摸索出一套最优的解题流程？**

---

### 2. AFlow 怎么做？

AFlow 的思路其实很简单，但也很巧妙：

#### 第一步：把“解题流程”变成“代码”

AFlow 把每一个解题步骤（比如“理解题意”、“列方程”、“检查答案”）都当成一个“节点”（Node），然后用代码把这些节点串起来，形成一个“工作流”（Workflow）。

- 举个例子：
  ```python
  # 伪代码示例
  async def solve_math(problem):
      step1 = await understand_problem(problem)  # 理解题意
      step2 = await generate_solution(step1)      # 生成解题思路
      step3 = await check_answer(step2)           # 检查答案
      return step3
  ```

#### 第二步：用“蒙特卡洛树搜索”（MCTS）自动摸索最优流程

AFlow 用了一个叫 **MCTS（蒙特卡洛树搜索）** 的算法，简单来说就是：

- **先随便试一个流程**（比如直接让 AI 瞎猜答案）。
- **看效果如何**（比如数学题能得分吗？）。
- **根据效果调整流程**（比如发现“检查答案”这一步很重要，就加上）。
- **再试再调**，不断重复，直到找到最好的流程。

这个过程就像你玩“猜数字”游戏，一开始瞎猜，后来慢慢摸到规律，最后变成猜数字高手。

---

### 3. AFlow 的效果有多牛？

论文里做了很多实验，选了 6 个不同类型的任务：

| 任务类型 | 举个例子 |
|----------|----------|
| 数学题   | GSM8K、MATH（小学到高中数学题） |
| 写代码   | HumanEval、MBPP（让 AI 写 Python 函数） |
| 问答     | HotpotQA、DROP（阅读理解题） |

结果 AFlow 搞出来的流程，**比人类专家设计的还要好**：

- 平均提升 **5.7%**（听起来不多，但在 AI 领域已经是很明显的提升了）。
- 最夸张的是，**用便宜的小模型（比如 DeepSeek）+ AFlow 搞出来的流程，居然比 GPT-4 本身还要厉害，而且成本只有 GPT-4 的 4.55%！**

---

### 4. AFlow 具体怎么操作的？（举个实际例子）

以 **数学题（GSM8K）** 为例：

一开始 AFlow 只有一个空白流程：

```python
async def solve_math(problem):
    return await llm(problem)  # 直接让 AI 瞎猜
```

效果当然很差。

然后 AFlow 开始自动调整：

- **第 2 轮**：发现“多生成几个答案再投票”效果好，于是加了“Ensemble”（集成）操作：
  ```python
  async def solve_math(problem):
      answers = [await llm(problem) for _ in range(3)]  # 生成 3 个答案
      return vote_best(answers)  # 投票选最好的
  ```

- **第 3 轮**：发现“检查答案”很重要，于是又加了“Programmer”操作（让 AI 写代码验证答案）：
  ```python
  async def solve_math(problem):
      answers = [await llm(problem) for _ in range(3)]
      best = vote_best(answers)
      checked = await check_with_code(best)  # 用代码验证
      return checked
  ```

最后，AFlow 自己摸索出了一个非常复杂的流程，效果远超人类设计的。

---

### 5. AFlow 的厉害之处总结：

| 传统方法 | AFlow 的方法 |
|----------|--------------|
| 人类专家手动设计流程 | AI 自动摸索最优流程 |
| 换个任务要重新设计 | 通用方法，自动适应新任务 |
| 贵的大模型才好用 | 便宜的小模型也能超神 |
| 人工成本高 | 完全自动化 |

---

## 一句话总结（再强调一次）：

**AFlow 就是一个“自动炼丹炉”，你给它一个问题，它就能自己炼出一套最优的“解题秘籍”，而且这个秘籍比人类专家写的还要厉害！**

---

## 额外彩蛋：

论文里还有个有趣的发现：

> 即使不给 AFlow 任何“人类经验”（比如不告诉它“检查答案”很重要），它自己也会慢慢摸索出“检查答案”这一步。  
> 这就好像你从来没学过数学，但自己慢慢发现“做完题检查一遍”很重要一样，非常神奇！

---

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Paper](https://img.shields.io/badge/Paper-ICLR%202025-red.svg)](https://arxiv.org/abs/2410.10762)

## 🚀 Quick Start

### 1. Installation

```bash
git clone https://github.com/yourname/aflow-stock-js.git
cd aflow-stock-js
npm install
```

### 2. Configuration

Copy the environment file and configure your API keys:

```bash
cp env.example .env
```

Edit `.env` file:
```env
# LLM API Keys (required for real optimization)
OPENAI_API_KEY=sk-your-openai-api-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# Configuration
DEFAULT_SYMBOL=AAPL
MAX_SEARCH_ROUNDS=15
LLM_MODEL=gpt-4
LLM_TEMPERATURE=0.7
```

### 3. Run Example

```bash
npm start
```

## 📁 Project Structure

```
aflow-stock-js/
├── src/
│   ├── nodes/                 # Individual workflow nodes
│   │   ├── fetchKline.js     # Stock data fetching
│   │   ├── technical.js      # Technical indicators
│   │   ├── news.js          # News data collection
│   │   ├── sentiment.js     # Sentiment analysis
│   │   └── predict.js       # Trading signal generation
│   ├── operators/            # Workflow combinations
│   │   └── stockOperators.js # Predefined workflow templates
│   ├── search/              # Search algorithms
│   │   ├── mcts.js         # Monte Carlo Tree Search
│   │   └── optimizer.js    # AFlow optimizer
│   ├── eval/               # Evaluation modules
│   │   └── backtestEval.js # Backtesting engine
│   └── utils/              # Utilities
│       ├── llm.js         # LLM client
│       └── cache.js       # Caching system
├── storage/               # Results and cache storage
├── test/                 # Test files
│   └── runExample.js     # Main example
├── package.json
└── README.md
```

### Debug Mode

Enable debug logging:

```javascript
process.env.DEBUG = 'true';
```

### Mock Mode

Run without API keys (uses mock data):

```bash
# No API keys needed
npm start
```

## 📚 References

- [AFlow Paper](https://arxiv.org/abs/2410.10762) - ICLR 2025 Oral
- [FoundationAgents/AFlow](https://github.com/FoundationAgents/AFlow) - Original implementation
- [Technical Indicators](https://github.com/anandanand84/technicalindicators) - Technical analysis library

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- ICLR 2025 AFlow paper authors
- Yahoo Finance for market data
- OpenAI and Anthropic for LLM APIs
- Technical indicators library contributors

---

**Note**: This is a research implementation. Use at your own risk for actual trading decisions.