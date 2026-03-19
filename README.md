# TripleA Engine

> 面向外贸与跨境电商的 AI 驱动营销与运营中台

TripleA Engine 是一个基于 Next.js 15 构建的全栈 AI 应用，集成了大语言模型（DeepSeek）、多媒体平台抓取（YouTube / Reddit）、AI 图像与视频生成（通义万相 / 阿里云 DashScope），帮助外贸团队完成市场洞察、内容生产、获客分析与社媒运营等核心工作。

---

## 功能模块

| 模块 | 路径 | 说明 |
|------|------|------|
| **市场洞察** | `/dashboard/market` | 用户画像分析、竞品研究、获客线索生成 |
| **营销内容** | `/dashboard/marketing` | AI 视频生成、多平台内容发布 |
| **社媒运营** | `/dashboard/operations` | 互动分析、粉丝增长报告、节日营销提醒 |
| **数据分析** | `/dashboard/analytics` | 渠道效果追踪、转化漏斗分析 |

### API 端点

```
POST /api/insights/profile      用户画像分析（Reddit 数据 + LLM 报告）
POST /api/insights/research     市场研究报告生成
POST /api/insights/acquisition  B2B 获客线索生成
POST /api/operations            社媒运营数据分析
POST /api/marketing             AI 视频生成任务提交
POST /api/content/publish       多平台内容发布
```

---

## 技术栈

- **框架**：Next.js 15 + React 18 + TypeScript
- **AI / LLM**：LangChain + DeepSeek Chat（兼容 OpenAI 接口）
- **图像生成**：阿里云 DashScope `qwen-image-2.0-pro` / `wanx-v1`
- **视频生成**：阿里云 DashScope `wan2.6-r2v-flash`
- **数据采集**：YouTube Data API v3、Reddit（Snoowrap）
- **后台任务**：node-cron + PM2（节日提醒 Worker）
- **样式**：Tailwind CSS

---

## 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd triple-a-engine
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制模板文件并填入你的密钥：

```bash
cp .env.example .env
```

编辑 `.env`，填写以下内容（详见下方[环境变量说明](#环境变量说明)）：

```env
DEEPSEEK_API_KEY=your_key
DASHSCOPE_API_KEY=your_key
REDDIT_CLIENT_ID=your_id
...
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 5. 生产部署（PM2）

```bash
npm install pm2 -g

# 启动 Next.js
pm2 start "npm run start" --name "nextjs"

# 启动节日提醒 Worker
pm2 start "ts-node src/worker/index.ts" --name "holiday-worker"

pm2 startup
pm2 save
```

---

## 环境变量说明

所有配置集中在项目根目录的 `.env` 文件中，**切勿将 `.env` 提交到版本控制**（已加入 `.gitignore`）。

### DeepSeek 大语言模型

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥（必填） | — |
| `DEEPSEEK_API_BASE` | API Base URL | `https://api.deepseek.com/v1` |
| `DEEPSEEK_MODEL` | 模型名称 | `deepseek-chat` |
| `DEEPSEEK_TEMPERATURE` | 温度参数 | `0` |

### 阿里云 DashScope（图像 / 视频生成）

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DASHSCOPE_API_KEY` | DashScope API 密钥（必填） | — |
| `DASHSCOPE_API_BASE` | API Base URL | `https://dashscope.aliyuncs.com/api/v1` |
| `DASHSCOPE_IMAGE_MODEL` | 文生图模型 | `qwen-image-2.0-pro` |
| `DASHSCOPE_TEXT2IMAGE_MODEL` | 图生图模型 | `wanx-v1` |
| `DASHSCOPE_VIDEO_MODEL` | 视频生成模型 | `wan2.6-r2v-flash` |

### Reddit

| 变量名 | 说明 |
|--------|------|
| `REDDIT_CLIENT_ID` | Reddit App Client ID |
| `REDDIT_CLIENT_SECRET` | Reddit App Client Secret |
| `REDDIT_USER_AGENT` | User Agent 字符串 |
| `REDDIT_USERNAME` | Reddit 账号用户名 |
| `REDDIT_PASSWORD` | Reddit 账号密码 |

> Reddit App 申请地址：[https://www.reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)

### YouTube

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 密钥 | — |
| `YOUTUBE_CLIENT_SECRETS_FILE` | OAuth2 客户端密钥文件路径 | `config/youtube_client.json` |
| `YOUTUBE_TOKEN_FILE` | OAuth2 Token 缓存文件路径 | `youtube_token.json` |

> YouTube API 申请：[Google Cloud Console](https://console.cloud.google.com/)

### 代理

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PROXY_URL` | HTTP/HTTPS 代理地址（国内访问 Reddit / YouTube 必填） | `http://127.0.0.1:7890` |

---

## 目录结构

```
triple-a-engine/
├── src/
│   ├── app/
│   │   ├── api/                  # Next.js API 路由
│   │   │   ├── insights/         # 市场洞察接口
│   │   │   ├── marketing/        # 视频生成接口
│   │   │   ├── operations/       # 运营分析接口
│   │   │   └── content/publish/  # 内容发布接口
│   │   └── dashboard/            # 前端页面
│   ├── lib/
│   │   ├── agents/               # LangChain Agent（评估、客服、用户研究）
│   │   ├── media/                # 平台采集客户端（YouTube、Reddit）
│   │   ├── models/aigc/          # AI 生图 / 生视频客户端
│   │   └── service/              # 业务逻辑层
│   ├── worker/                   # 后台 Worker（节日提醒）
│   ├── types/                    # TypeScript 类型定义
│   └── config/                   # 配置参考文件
├── .env                          # 本地环境变量（不提交）
├── .env.example                  # 环境变量模板（提交）
└── docker                        # PM2 启动命令参考
```

---

## 常见问题

**Q: 访问 Reddit / YouTube 报网络错误？**  
A: 请确保 `.env` 中 `PROXY_URL` 指向可用的本地代理（如 Clash 默认端口 `7890`）。

**Q: 图片 / 视频生成返回 API Key 错误？**  
A: 检查 `DASHSCOPE_API_KEY` 是否正确，并确认阿里云账号已开通 DashScope 相关模型权限。

**Q: DeepSeek 调用失败？**  
A: 确认 `DEEPSEEK_API_KEY` 有效且账户余额充足，`DEEPSEEK_API_BASE` 默认值无需修改。

---

## 许可证

本项目为私有项目，未经授权禁止转载或商用。
