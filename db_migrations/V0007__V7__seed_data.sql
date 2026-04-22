INSERT INTO forum_categories (name, description, icon, color, sort_order)
SELECT 'Общие обсуждения', 'Разговоры на любые темы', '⚡', '#f97316', 1
WHERE NOT EXISTS (SELECT 1 FROM forum_categories WHERE name = 'Общие обсуждения');

INSERT INTO forum_categories (name, description, icon, color, sort_order)
SELECT 'Новости и события', 'Актуальные новости и анонсы', '📢', '#ef4444', 2
WHERE NOT EXISTS (SELECT 1 FROM forum_categories WHERE name = 'Новости и события');

INSERT INTO forum_categories (name, description, icon, color, sort_order)
SELECT 'Технологии', 'IT, программирование, гаджеты', '💻', '#3b82f6', 3
WHERE NOT EXISTS (SELECT 1 FROM forum_categories WHERE name = 'Технологии');

INSERT INTO forum_categories (name, description, icon, color, sort_order)
SELECT 'Игры', 'Видеоигры, настолки, все виды игр', '🎮', '#8b5cf6', 4
WHERE NOT EXISTS (SELECT 1 FROM forum_categories WHERE name = 'Игры');

INSERT INTO forum_categories (name, description, icon, color, sort_order)
SELECT 'Творчество', 'Искусство, музыка, литература', '🎨', '#ec4899', 5
WHERE NOT EXISTS (SELECT 1 FROM forum_categories WHERE name = 'Творчество');

INSERT INTO forum_categories (name, description, icon, color, sort_order)
SELECT 'Помощь и поддержка', 'Вопросы к администрации', '🛡', '#10b981', 6
WHERE NOT EXISTS (SELECT 1 FROM forum_categories WHERE name = 'Помощь и поддержка');

INSERT INTO forum_users (username, email, password_hash, role, bio)
SELECT 'admin', 'admin@grozaforum.ru', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMXcuGl/TNEpCYPQRpsFQNEHIe', 'admin', 'Администратор форума Грозы'
WHERE NOT EXISTS (SELECT 1 FROM forum_users WHERE username = 'admin');