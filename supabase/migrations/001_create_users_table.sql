-- 迁移脚本: 创建用户表
-- 创建时间: 2025-01-22
-- 描述: 用户认证和管理的初始用户表

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);


-- 创建自动更新 updated_at 时间戳的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器，在行更新时自动更新 updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 添加表和字段注释
COMMENT ON TABLE users IS '用户账户表，用于认证和个人资料管理';
COMMENT ON COLUMN users.id IS '用户唯一标识符（自增主键）';
COMMENT ON COLUMN users.email IS '用户邮箱地址，必须唯一';
COMMENT ON COLUMN users.username IS '用户名，必须唯一';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt加密的密码哈希';
COMMENT ON COLUMN users.deleted_at IS '逻辑删除时间，NULL表示未删除';
COMMENT ON COLUMN users.created_at IS '用户创建时间';
COMMENT ON COLUMN users.updated_at IS '用户最后更新时间';

-- 启用行级安全策略 (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
-- 策略: 用户可以查看自己的数据（排除已删除用户）
CREATE POLICY "用户可以查看自己的资料"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text AND deleted_at IS NULL);

-- 策略: 用户可以更新自己的数据（排除已删除用户）
CREATE POLICY "用户可以更新自己的资料"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text AND deleted_at IS NULL)
  WITH CHECK (auth.uid()::text = id::text AND deleted_at IS NULL);

-- 策略: 允许服务角色执行所有操作（用于 API 操作）
CREATE POLICY "服务角色可以管理所有用户"
  ON users FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 策略: 允许匿名角色插入新用户（用于注册）
CREATE POLICY "匿名用户可以注册"
  ON users FOR INSERT
  WITH CHECK (auth.role() = 'anon' OR auth.role() = 'service_role');