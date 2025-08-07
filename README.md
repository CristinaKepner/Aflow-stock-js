# AFlow Stock Analysis System

基于AFlow算法的股票量化分析系统，支持自动工作流优化、多符号并行分析和实时模拟交易。

## 📦 快速安装

```bash
git clone git@github.com:CristinaKepner/Aflow-stock-js.git
cd aflow-stock-js
chmod +x deploy.sh
./deploy.sh
```

## ⚙️ 配置

复制环境变量模板并配置API密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# LLM API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Stock Data API Keys (Optional)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
YAHOO_FINANCE_API_KEY=your_yahoo_finance_key

# Configuration
DEFAULT_SYMBOL=AAPL
BACKTEST_DAYS=30
MAX_SEARCH_ROUNDS=5
LLM_MODEL=moonshot-v1-8k
LLM_TEMPERATURE=0.7
CACHE_ENABLED=true
CACHE_TTL=3600
```

## 🎯 使用方法

### 快速开始

```bash
npm start
```

### 多符号并行优化

```bash
npm run multisymbol
```

### 启动完整系统

```bash
npm run full
```

访问前端界面：http://localhost:3000

## 📁 项目结构

```
aflow-stock-js/
├── src/
│   ├── nodes/           # 数据节点
│   │   ├── fetchKline.js    # K线数据获取
│   │   ├── technical.js     # 技术指标计算
│   │   ├── news.js          # 新闻数据获取
│   │   ├── sentiment.js     # 情感分析
│   │   ├── predict.js       # 预测生成
│   │   └── eastmoney.js     # 东方财富数据
│   ├── operators/       # 工作流操作符
│   │   └── stockOperators.js
│   ├── search/          # 搜索算法
│   │   ├── mcts.js          # 蒙特卡洛树搜索
│   │   ├── optimizer.js     # AFlow优化器
│   │   └── multiSymbolOptimizer.js
│   ├── eval/            # 评估模块
│   │   └── backtestEval.js
│   ├── trading/         # 交易模块
│   │   └── paperTrading.js
│   ├── utils/           # 工具模块
│   │   ├── llm.js           # LLM客户端
│   │   └── cache.js         # 缓存管理
│   └── server.js        # 后端服务器
├── frontend/            # React前端
├── test/                # 测试脚本
├── storage/             # 数据存储
├── deploy.sh            # 部署脚本
├── package.json
└── README.md
```

## 🔧 API接口

### Dashboard统计
- `GET /api/dashboard/stats` - 获取仪表板统计数据

### 工作流管理
- `POST /api/workflow/run` - 运行工作流
- `POST /api/workflow/save` - 保存工作流
- `GET /api/workflow/list` - 获取工作流列表

### 模拟交易
- `POST /api/paper-trading/start` - 启动模拟交易
- `POST /api/paper-trading/stop` - 停止模拟交易
- `GET /api/paper-trading/status` - 获取交易状态

### 优化
- `POST /api/optimization/single` - 单符号优化
- `POST /api/optimization/multi-symbol` - 多符号优化

### 数据获取
- `GET /api/data/kline/:symbol` - 获取K线数据
- `GET /api/data/news/:symbol` - 获取新闻数据
- `GET /api/data/technical/:symbol` - 获取技术指标

## 📊 示例输出

```
🚀 Starting AFlow optimization for AAPL
📊 Max rounds: 5

🔄 Round 1/5
🔍 MCTS search completed. Best score: 0.083
🤖 Generating improved workflow...
✅ Improvement accepted: 8.33%
Round 1 result: 58.33% (best: 58.33%)

=== Backtest Results ===
Symbol: AAPL
Total Trades: 30
Win Rate: 58.33%
Total Return: 2.45%
Avg Return: 0.08%
Sharpe Ratio: 0.156
```


## 🙏 致谢

- [AFlow论文](https://arxiv.org/abs/2410.10762)
- [FoundationAgents/AFlow](https://github.com/FoundationAgents/AFlow)


## 🙏 关于 Aflow

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