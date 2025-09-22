# Synapse 认证系统演示

## 功能概述

已成功集成邮箱注册登录功能，包含完整的JWT认证体系和可扩展的OAuth架构。

## 已实现功能

### 1. 后端 API (Vercel Functions)

- **POST /api/auth/register** - 用户注册
- **POST /api/auth/login** - 用户登录
- **POST /api/auth/verify** - Token验证
- **POST /api/auth/refresh** - Token刷新

### 2. 前端功能

- **认证上下文** - 全局用户状态管理
- **登录/注册表单** - 响应式UI组件
- **用户菜单** - 头像下拉菜单
- **路由保护** - 自动重定向未认证用户
- **Token自动刷新** - 后台定期检查并刷新过期token

### 3. 安全特性

- **JWT双token机制** - Access Token (15分钟) + Refresh Token (7天)
- **密码加密** - bcrypt哈希存储
- **输入验证** - 邮箱、用户名、密码格式检查
- **自动登录维持** - 本地存储+自动刷新

## 测试步骤

1. **启动应用**
   ```bash
   npm run dev
   ```
   访问 http://localhost:5174

2. **未登录状态**
   - 显示欢迎页面
   - 点击"开始使用"弹出认证弹窗

3. **注册新账号**
   - 填写邮箱、用户名、密码
   - 密码要求：至少6位，包含大小写字母和数字
   - 成功后自动登录

4. **登录现有账号**
   - 使用已注册的邮箱和密码
   - 支持切换到注册表单

5. **已登录状态**
   - 正常访问Synapse功能
   - 右上角显示用户头像菜单
   - 支持退出登录

## 数据存储

当前使用localStorage作为临时存储方案：

```javascript
// 存储结构
{
  "synapse_users": [...],         // 用户账号数据
  "synapse_access_token": "...",  // 访问令牌
  "synapse_refresh_token": "...", // 刷新令牌
  "synapse_current_user": {...}   // 当前用户信息
}
```

## OAuth扩展预留

架构已预留第三方登录接口：

```typescript
// 支持的提供者类型
interface AuthProviderConfig {
  type: 'email' | 'oauth';
  provider?: 'github' | 'google';
  name: string;
  icon?: string;
}
```

后续可轻松添加GitHub、Google等OAuth登录方式。

## 环境变量配置

```bash
# .env.local
JWT_SECRET=your-jwt-secret-key
REFRESH_SECRET=your-refresh-secret-key
```

## 生产部署注意事项

1. **更换JWT密钥** - 使用强随机密钥
2. **数据库迁移** - 从localStorage迁移到PostgreSQL/MongoDB
3. **HTTPS强制** - 确保生产环境使用HTTPS
4. **速率限制** - 添加API调用频率限制
5. **日志监控** - 添加认证相关日志记录