# TripleA Engine

> AI-powered marketing and operations platform for cross-border e-commerce

TripleA Engine is a full-stack AI application built on Next.js 15. It integrates large language models (DeepSeek), multi-platform data collection (YouTube / Reddit), and AI image & video generation (Tongyi Wanxiang / Aliyun DashScope) — helping foreign trade teams with market insights, content production, lead generation, and social media operations.

---

## Feature Modules

| Module | Path | Description |
|--------|------|-------------|
| **Market Insights** | `/dashboard/market` | User persona analysis, competitive research, lead generation |
| **Marketing Content** | `/dashboard/marketing` | AI video generation, multi-platform content publishing |
| **Social Operations** | `/dashboard/operations` | Engagement analytics, follower growth reports, holiday marketing reminders |
| **Analytics** | `/dashboard/analytics` | Channel performance tracking, conversion funnel analysis |

### API Endpoints

```
POST /api/insights/profile      User persona analysis (Reddit data + LLM report)
POST /api/insights/research     Market research report generation
POST /api/insights/acquisition  B2B lead generation
POST /api/operations            Social media operations analysis
POST /api/marketing             AI video generation task submission
POST /api/content/publish       Multi-platform content publishing
```

---

## Tech Stack

- **Framework**: Next.js 15 + React 18 + TypeScript
- **AI / LLM**: LangChain + DeepSeek Chat (OpenAI-compatible API)
- **Image Generation**: Aliyun DashScope `qwen-image-2.0-pro` / `wanx-v1`
- **Video Generation**: Aliyun DashScope `wan2.6-r2v-flash`
- **Data Collection**: YouTube Data API v3, Reddit (Snoowrap)
- **Background Jobs**: node-cron + PM2 (holiday reminder worker)
- **Styling**: Tailwind CSS

---

## Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd triple-a-engine
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the template and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your keys (see [Environment Variables](#environment-variables) below):

```env
DEEPSEEK_API_KEY=your_key
DASHSCOPE_API_KEY=your_key
REDDIT_CLIENT_ID=your_id
...
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production deployment (PM2)

```bash
npm install pm2 -g

# Start Next.js
pm2 start "npm run start" --name "nextjs"

# Start the holiday reminder worker
pm2 start "ts-node src/worker/index.ts" --name "holiday-worker"

pm2 startup
pm2 save
```

---

## Environment Variables

All configuration is stored in the `.env` file at the project root. **Never commit `.env` to version control** — it is already listed in `.gitignore`.

Use `.env.example` as the template to share with your team.

### DeepSeek LLM

| Variable | Description | Default |
|----------|-------------|---------|
| `DEEPSEEK_API_KEY` | DeepSeek API key (**required**) | — |
| `DEEPSEEK_API_BASE` | API base URL | `https://api.deepseek.com/v1` |
| `DEEPSEEK_MODEL` | Model name | `deepseek-chat` |
| `DEEPSEEK_TEMPERATURE` | Temperature | `0` |

### Aliyun DashScope (Image / Video Generation)

| Variable | Description | Default |
|----------|-------------|---------|
| `DASHSCOPE_API_KEY` | DashScope API key (**required**) | — |
| `DASHSCOPE_API_BASE` | API base URL | `https://dashscope.aliyuncs.com/api/v1` |
| `DASHSCOPE_IMAGE_MODEL` | Text-to-image model | `qwen-image-2.0-pro` |
| `DASHSCOPE_TEXT2IMAGE_MODEL` | Image-to-image model | `wanx-v1` |
| `DASHSCOPE_VIDEO_MODEL` | Video generation model | `wan2.6-r2v-flash` |

### Reddit

| Variable | Description |
|----------|-------------|
| `REDDIT_CLIENT_ID` | Reddit app client ID |
| `REDDIT_CLIENT_SECRET` | Reddit app client secret |
| `REDDIT_USER_AGENT` | User agent string |
| `REDDIT_USERNAME` | Reddit account username |
| `REDDIT_PASSWORD` | Reddit account password |

> Create a Reddit app at: [https://www.reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)

### YouTube

| Variable | Description | Default |
|----------|-------------|---------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | — |
| `YOUTUBE_CLIENT_SECRETS_FILE` | Path to OAuth2 client secrets JSON | `config/youtube_client.json` |
| `YOUTUBE_TOKEN_FILE` | Path to cached OAuth2 token file | `youtube_token.json` |

> Get a YouTube API key from [Google Cloud Console](https://console.cloud.google.com/).

### Proxy

| Variable | Description | Default |
|----------|-------------|---------|
| `PROXY_URL` | HTTP/HTTPS proxy address (required when accessing Reddit / YouTube from mainland China) | `http://127.0.0.1:7890` |

---

## Project Structure

```
triple-a-engine/
├── src/
│   ├── app/
│   │   ├── api/                  # Next.js API routes
│   │   │   ├── insights/         # Market insights endpoints
│   │   │   ├── marketing/        # Video generation endpoint
│   │   │   ├── operations/       # Operations analytics endpoint
│   │   │   └── content/publish/  # Content publishing endpoint
│   │   └── dashboard/            # Frontend pages
│   ├── lib/
│   │   ├── agents/               # LangChain agents (assessment, customer service, user research)
│   │   ├── media/                # Platform clients (YouTube, Reddit)
│   │   ├── models/aigc/          # AI image / video generation clients
│   │   └── service/              # Business logic layer
│   ├── worker/                   # Background worker (holiday reminders)
│   ├── types/                    # TypeScript type definitions
│   └── config/                   # Configuration reference files
├── .env                          # Local environment variables (not committed)
├── .env.example                  # Environment variable template (committed)
└── docker                        # PM2 startup command reference
```

---

## FAQ

**Q: Network errors when accessing Reddit or YouTube?**  
A: Make sure `PROXY_URL` in `.env` points to a working local proxy (e.g., Clash default port `7890`).

**Q: Image or video generation returns an API key error?**  
A: Verify that `DASHSCOPE_API_KEY` is correct and that your Aliyun account has the required DashScope model permissions enabled.

**Q: DeepSeek API calls failing?**  
A: Confirm that `DEEPSEEK_API_KEY` is valid and your account has sufficient balance. The default `DEEPSEEK_API_BASE` value does not need to be changed.

**Q: YouTube OAuth2 authentication fails?**  
A: Ensure `YOUTUBE_CLIENT_SECRETS_FILE` points to a valid `youtube_client.json` downloaded from Google Cloud Console, and that the YouTube Data API v3 is enabled for your project.

---

## License

This is a private project. Redistribution or commercial use without authorization is prohibited.
