CREATE TABLE forum_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(20) DEFAULT '⚡',
  color VARCHAR(7) DEFAULT '#f97316',
  sort_order INT DEFAULT 0,
  topics_count INT DEFAULT 0,
  posts_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);