CREATE TABLE forum_posts (id SERIAL PRIMARY KEY, topic_id INT NOT NULL, author_id INT NOT NULL, content TEXT NOT NULL, is_read BOOLEAN, created_at TIMESTAMP, updated_at TIMESTAMP);

CREATE TABLE forum_messages (id SERIAL PRIMARY KEY, from_user_id INT NOT NULL, to_user_id INT NOT NULL, subject VARCHAR(255), content TEXT NOT NULL, is_read BOOLEAN, created_at TIMESTAMP);