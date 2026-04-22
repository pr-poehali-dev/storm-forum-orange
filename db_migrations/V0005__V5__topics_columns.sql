ALTER TABLE forum_topics ADD COLUMN is_pinned BOOLEAN;
ALTER TABLE forum_topics ADD COLUMN is_locked BOOLEAN;
ALTER TABLE forum_topics ADD COLUMN views_count INT;
ALTER TABLE forum_topics ADD COLUMN replies_count INT;
ALTER TABLE forum_topics ADD COLUMN last_post_at TIMESTAMP;
ALTER TABLE forum_topics ADD COLUMN created_at TIMESTAMP;