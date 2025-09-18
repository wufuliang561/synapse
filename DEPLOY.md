# Synapse 部署指南

## Vercel 部署配置

### 1. 环境准备

确保你有以下账号和资源：
- [Vercel 账号](https://vercel.com)
- Google Gemini API Key
- GitHub 仓库（推荐）

### 2. 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 3. 环境变量配置

创建 `.env.local` 文件：

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

**获取 Gemini API Key：**
1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 创建新的 API Key
3. 复制密钥并添加到环境变量

### 4. Vercel 部署

#### 方法一：通过 Vercel Dashboard（推荐）

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入你的 GitHub 仓库
4. Vercel 会自动检测为 Vite 项目
5. 在 "Environment Variables" 中添加：
   - `GEMINI_API_KEY`: 你的 Gemini API Key
6. 点击 "Deploy"

#### 方法二：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 首次部署
vercel

# 设置环境变量
vercel env add GEMINI_API_KEY production

# 后续部署
vercel --prod
```

### 5. 项目结构

```
synapse/
├── api/
│   ├── chat.ts          # AI 聊天 API 端点
│   └── package.json     # API 依赖
├── components/          # React 组件
├── App.tsx             # 主应用
├── index.tsx           # 入口文件
├── index.html          # HTML 模板
├── package.json        # 前端依赖
├── vite.config.ts      # Vite 配置
├── vercel.json         # Vercel 配置
└── DEPLOY.md          # 本文档
```

### 6. API 端点

部署后，你的 API 端点将可用于：

- **本地开发**: `http://localhost:5173/api/chat`
- **生产环境**: `https://your-app.vercel.app/api/chat`

#### API 使用示例

```javascript
// POST /api/chat
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: '你好' },
      { role: 'model', content: '你好！有什么我可以帮助你的吗？' },
      { role: 'user', content: '请介绍一下人工智能' }
    ]
  })
});

const data = await response.json();
console.log(data.message); // AI 回复
```

### 7. 常见问题

#### 部署失败
- 检查 `package.json` 中的脚本是否正确
- 确认环境变量是否设置
- 查看 Vercel 部署日志

#### API 调用失败
- 确认 `GEMINI_API_KEY` 环境变量已设置
- 检查 API Key 是否有效
- 查看 Vercel Functions 日志

#### 本地开发问题
- 确保 `.env.local` 文件存在且包含正确的 API Key
- 检查端口 5173 是否被占用
- 清除缓存：`rm -rf node_modules/.vite`

### 8. 性能优化

- Vercel 自动启用 CDN 和缓存
- 静态资源自动压缩
- Serverless Functions 自动缩放
- 支持边缘计算加速

### 9. 监控和分析

在 Vercel Dashboard 中可以查看：
- 部署历史
- 函数调用统计
- 性能指标
- 错误日志

### 10. 自定义域名

1. 在 Vercel Dashboard 中选择项目
2. 进入 "Settings" → "Domains"
3. 添加你的自定义域名
4. 按照说明配置 DNS

---

## 技术栈

- **前端**: React 19 + TypeScript + Vite
- **AI**: Google Gemini 2.0 Flash
- **部署**: Vercel (Static + Serverless Functions)
- **画布**: React Flow (@xyflow/react)

## 支持

如有问题，请查看：
- [Vercel 文档](https://vercel.com/docs)
- [Vite 文档](https://vitejs.dev)
- [Google Gemini API 文档](https://ai.google.dev/docs)