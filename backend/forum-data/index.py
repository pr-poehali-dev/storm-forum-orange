"""Данные форума Грозы: категории, темы, посты, поиск"""
import json
import os
import psycopg2
from datetime import datetime

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    'Content-Type': 'application/json'
}

SCHEMA = 't_p11081021_storm_forum_orange'

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'], options=f'-c search_path={SCHEMA},public')

def get_user_by_session(cur, session_id):
    if not session_id:
        return None
    cur.execute("""
        SELECT u.id, u.username, u.role
        FROM forum_sessions s
        JOIN forum_users u ON s.user_id = u.id
        WHERE s.id = %s AND s.expires_at > NOW()
    """, (session_id,))
    return cur.fetchone()

def json_serial(obj):
    if isinstance(obj, datetime):
        return obj.strftime('%Y-%m-%d %H:%M')
    return str(obj)

def handler(event: dict, context) -> dict:
    """Категории, темы, посты форума"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except:
            pass

    headers = event.get('headers', {})
    session_id = headers.get('x-session-id') or headers.get('X-Session-Id', '')

    conn = get_conn()
    cur = conn.cursor()

    try:
        current_user = get_user_by_session(cur, session_id)

        # GET categories
        if action == 'categories' or (method == 'GET' and 'categories' in path):
            cur.execute("SELECT id, name, description, icon, color, sort_order, topics_count, posts_count FROM forum_categories ORDER BY sort_order")
            rows = cur.fetchall()
            cats = [{'id': r[0], 'name': r[1], 'description': r[2], 'icon': r[3], 'color': r[4], 'sort_order': r[5], 'topics_count': r[6], 'posts_count': r[7]} for r in rows]
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(cats)}

        # GET topics
        if action == 'topics' or (method == 'GET' and 'topics' in path and 'posts' not in path):
            cat_id = params.get('category_id')
            topic_id = params.get('topic_id')

            if topic_id:
                cur.execute("""
                    SELECT t.id, t.title, t.category_id, t.author_id, u.username,
                           t.is_pinned, t.is_locked, t.views_count, t.replies_count, t.last_post_at, t.created_at
                    FROM forum_topics t
                    JOIN forum_users u ON t.author_id = u.id
                    WHERE t.id = %s
                """, (topic_id,))
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Тема не найдена'})}
                cur.execute("UPDATE forum_topics SET views_count = COALESCE(views_count, 0) + 1 WHERE id = %s", (topic_id,))
                conn.commit()
                topic = {
                    'id': row[0], 'title': row[1], 'category_id': row[2], 'author_id': row[3],
                    'author': row[4], 'is_pinned': row[5], 'is_locked': row[6],
                    'views_count': row[7], 'replies_count': row[8],
                    'last_post_at': json_serial(row[9]), 'created_at': json_serial(row[10])
                }
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(topic)}

            query = """
                SELECT t.id, t.title, t.category_id, t.author_id, u.username,
                       t.is_pinned, t.is_locked, t.views_count, t.replies_count, t.last_post_at, t.created_at
                FROM forum_topics t
                JOIN forum_users u ON t.author_id = u.id
                WHERE 1=1
            """
            args = []
            if cat_id:
                query += " AND t.category_id = %s"
                args.append(cat_id)
            query += " ORDER BY t.is_pinned DESC NULLS LAST, t.last_post_at DESC NULLS LAST LIMIT 50"

            cur.execute(query, args)
            rows = cur.fetchall()
            topics = [{
                'id': r[0], 'title': r[1], 'category_id': r[2], 'author_id': r[3],
                'author': r[4], 'is_pinned': r[5] or False, 'is_locked': r[6] or False,
                'views_count': r[7] or 0, 'replies_count': r[8] or 0,
                'last_post_at': json_serial(r[9]), 'created_at': json_serial(r[10])
            } for r in rows]
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(topics)}

        # POST create-topic
        if action == 'create-topic' or (method == 'POST' and 'topics' in path and 'posts' not in path):
            if not current_user:
                return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Необходима авторизация'})}

            title = body.get('title', '').strip()
            cat_id = body.get('category_id')
            content = body.get('content', '').strip()

            if not title or not cat_id or not content:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Заполните все поля'})}

            user_id = current_user[0]
            cur.execute(
                "INSERT INTO forum_topics (category_id, author_id, title, views_count, replies_count, last_post_at, created_at) VALUES (%s, %s, %s, 0, 0, NOW(), NOW()) RETURNING id",
                (cat_id, user_id, title)
            )
            topic_id = cur.fetchone()[0]
            cur.execute(
                "INSERT INTO forum_posts (topic_id, author_id, content, created_at, updated_at) VALUES (%s, %s, %s, NOW(), NOW())",
                (topic_id, user_id, content)
            )
            cur.execute("UPDATE forum_categories SET topics_count = COALESCE(topics_count, 0) + 1, posts_count = COALESCE(posts_count, 0) + 1 WHERE id = %s", (cat_id,))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'topic_id': topic_id})}

        # GET posts
        if action == 'posts' or (method == 'GET' and 'posts' in path):
            topic_id = params.get('topic_id')
            if not topic_id:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'topic_id required'})}

            cur.execute("""
                SELECT p.id, p.content, p.author_id, u.username, u.role, u.posts_count, p.created_at
                FROM forum_posts p
                JOIN forum_users u ON p.author_id = u.id
                WHERE p.topic_id = %s
                ORDER BY p.created_at ASC
            """, (topic_id,))
            rows = cur.fetchall()
            posts = [{
                'id': r[0], 'content': r[1], 'author_id': r[2],
                'author': r[3], 'author_role': r[4], 'author_posts': r[5] or 0,
                'created_at': json_serial(r[6])
            } for r in rows]
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(posts)}

        # POST reply
        if action == 'reply' or (method == 'POST' and 'posts' in path):
            if not current_user:
                return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Необходима авторизация'})}

            topic_id = body.get('topic_id')
            content = body.get('content', '').strip()

            if not topic_id or not content:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Заполните все поля'})}

            user_id = current_user[0]
            cur.execute("SELECT is_locked FROM forum_topics WHERE id = %s", (topic_id,))
            topic = cur.fetchone()
            if not topic:
                return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Тема не найдена'})}
            if topic[0]:
                return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Тема закрыта для ответов'})}

            cur.execute(
                "INSERT INTO forum_posts (topic_id, author_id, content, created_at, updated_at) VALUES (%s, %s, %s, NOW(), NOW()) RETURNING id",
                (topic_id, user_id, content)
            )
            post_id = cur.fetchone()[0]
            cur.execute("UPDATE forum_topics SET replies_count = COALESCE(replies_count, 0) + 1, last_post_at = NOW() WHERE id = %s", (topic_id,))
            cur.execute("UPDATE forum_users SET posts_count = COALESCE(posts_count, 0) + 1 WHERE id = %s", (user_id,))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'post_id': post_id})}

        # GET search
        if action == 'search' or (method == 'GET' and 'search' in path):
            q = params.get('q', '').strip()
            if not q or len(q) < 2:
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps([])}

            cur.execute("""
                SELECT t.id, t.title, t.category_id, c.name as cat_name, u.username, t.replies_count, t.views_count, t.created_at
                FROM forum_topics t
                JOIN forum_users u ON t.author_id = u.id
                JOIN forum_categories c ON t.category_id = c.id
                WHERE LOWER(t.title) LIKE LOWER(%s)
                ORDER BY t.created_at DESC LIMIT 20
            """, (f'%{q}%',))
            rows = cur.fetchall()
            results = [{
                'id': r[0], 'title': r[1], 'category_id': r[2], 'category': r[3],
                'author': r[4], 'replies_count': r[5] or 0, 'views_count': r[6] or 0,
                'created_at': json_serial(r[7])
            } for r in rows]
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(results)}

        # GET stats
        if action == 'stats' or (method == 'GET' and 'stats' in path):
            cur.execute("SELECT COUNT(*) FROM forum_users")
            users_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM forum_topics")
            topics_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM forum_posts")
            posts_count = cur.fetchone()[0]
            cur.execute("SELECT username FROM forum_users ORDER BY created_at DESC LIMIT 1")
            last_user = cur.fetchone()
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'users_count': users_count,
                    'topics_count': topics_count,
                    'posts_count': posts_count,
                    'last_user': last_user[0] if last_user else None
                })
            }

        return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        cur.close()
        conn.close()
