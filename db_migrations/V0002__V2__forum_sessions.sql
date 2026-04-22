CREATE TABLE forum_sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id INT NOT NULL REFERENCES forum_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);