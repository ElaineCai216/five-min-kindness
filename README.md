# 五分钟善意 ☀️

每天早上打开，收获一个微小的、不需要社交压力的善意挑战——比如给路边的植物浇一点水、给许久未见的朋友发一张路边的风景照。五分钟就够。

## 功能

- **打开即见今日挑战**：同一天所有人看到同一条（由日期确定性决定），可以放心分享
- **按日期 + 季节轮换**：春/夏/秋/冬各有专属题库，周末还会出现「周末专属」挑战
- **三类内容**：对他人（低社交压力）/ 对环境 / 对自己，保持平衡
- **轻打卡**：一键标记「今天做过了」，记录连续天数；错过不施压，文案永远温和
- **动态编辑插画背景**（参考 Editorial Illustration）：扁平色块 + 粗描边的太阳 / 云朵 / 新芽 / 浇水壶 / 爱心 / 茶杯 / 信封等图形在暖奶油纸面上漂浮、摆动、旋转；四角有固定的构图元素（太阳、云朵、色块、小花），远景小山与色块缓慢呼吸；所有元素避开中央卡片、碰到就弹开；点击任意处还会绽放一颗小图形
- **声音**：Web Audio 合成的轻音效 + 可开关的舒缓背景乐（C–G–Am–F 循环），全部离线生成
- **让 AI 写（可选）**：接好 Cloudflare Worker 后可用，未配置时自动回落本地题库
- **分享**：一键把今天的挑战发给朋友（Web Share，降级为复制文本）
- **零依赖、零外部资源**：双击 `index.html` 即可离线使用；数据只存在本机浏览器

## 使用

直接双击 `index.html` 打开即可。数据保存在浏览器 `localStorage`（键 `five-min-kindness:v1`）。

调试与自检：

- `index.html?date=2026-03-20`：模拟任意日期，验证季节轮换与确定性
- `index.html?selftest`：运行内置自检（题库完整性 / 确定性 / 季节 / 周末池 / 打卡计算）

## 启用「让 AI 写」（可选）

1. 在 Cloudflare 创建 Worker，或用本目录 `worker/` 部署：

   ```bash
   cd worker
   npx wrangler deploy
   ```

2. 配置密钥与环境变量：

   ```bash
   npx wrangler secret put DEEPSEEK_API_KEY     # 大模型 Key（默认 DeepSeek）
   npx wrangler secret put OPENAI_API_KEY       # 或任意 OpenAI 兼容接口
   ```

   可选变量（`wrangler.toml` 的 `[vars]` 或控制台）：

   | 变量 | 说明 |
   | --- | --- |
   | `BASE_URL` | OpenAI 兼容接口地址，默认 `https://api.deepseek.com` |
   | `MODEL` | 模型名，默认 `deepseek-chat` |
   | `ALLOWED_ORIGIN` | 允许的前端来源，逗号分隔；如 `https://elainecai216.github.io` |

3. 把 Worker 地址填到 `index.html` 顶部脚本里的常量：

   ```js
   const WORKER_URL = "https://five-min-kindness-ai.你的子域.workers.dev";
   ```

   然后重新打开网页即可。未填写时，「让 AI 写」会给出柔和提示并换一条本地挑战。

> Token 只保存在 Cloudflare 服务端，前端永远接触不到。

## 目录结构

```
five-min-kindness/
├── index.html        # 单文件应用（零依赖，双击即用）
├── worker/
│   ├── index.js      # AI 挑战代理（可选部署）
│   └── wrangler.toml
└── README.md
```
