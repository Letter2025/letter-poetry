-- [LETTER-POETRY-PLAN-015] 访问密钥门的 session 表（代码里也有 CREATE TABLE IF NOT EXISTS 兜底）
CREATE TABLE IF NOT EXISTS app_sessions (
  token TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_app_sessions_expires ON app_sessions(expires_at);