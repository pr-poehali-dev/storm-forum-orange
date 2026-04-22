"""Админ-панель форума Грозы"""
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

def get_admin(cur, session_id):
    if not session_id:
        return None
    cur.execute("""
        SELECT u.id, u.username, u.role
        FROM forum_sessions s
        JOIN forum_users u ON s.user_id = u.id
        WHERE s.id = %s AND s.expires_at > NOW() AND u.role IN ('admin', 'moderator')
    """, (session_id,))
    return cur.fetchone()

def json_serial(obj):
    if isinstance(obj, datetime):
        return obj.strftime('%Y-%m-%d %H:%M')
    return str(obj)

def handler(event: dict, context) -> dict:
    """Управление пользователями, темами, категориями"""
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
        admin = get_admin(cur, session_id)
        if not admin:
            return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Доступ запрещён'})}

        admin_id, admin_name, admin_role = admin

        # GET users
        if action == 'users' or (method == 'GET' and 'users' in path):
            cur.execute("""
                SELECT id, username, email, role, posts_count, is_banned, created_at, last_seen_at
                FROM forum_users ORDER BY created_at DESC LIMIT 100
            """)
            rows = cur.fetchall()
            users = [{
                'id': r[0], 'username': r[1], 'email': r[2], 'role': r[3],
                'posts_count': r[4] or 0, 'is_banned': r[5] or False,
                'created_at': json_serial(r[6]), 'last_seen_at': json_serial(r[7])
            } for r in rows]
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(users)}

        # PUT ban
        if action == 'ban' or (method == 'PUT' and 'ban' in path):
            user_id = body.get('user_id')
            is_banned = body.get('is_banned', True)
            cur.execute("UPDATE forum_users SET is_banned = %s WHERE id = %s", (is_banned, user_id))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

        # PUT role
        if action == 'set-role' or (method == 'PUT' and 'role' in path):
            if admin_role != 'admin':
                return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Только администратор'})}
            user_id = body.get('user_id')
            role = body.get('role', 'user')
            if role not in ('user', 'moderator', 'admin'):
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неверная роль'})}
            cur.execute("UPDATE forum_users SET role = %s WHERE id = %s", (role, user_id))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

        # GET topics
        if action == 'topics' or (method == 'GET' and 'topics' in path):
            cur.execute("""
                SELECT t.id, t.title, t.category_id, c.name, u.username, t.is_pinned, t.is_locked, t.replies_count, t.created_at
                FROM forum_topics t
                JOIN forum_users u ON t.author_id = u.id
                JOIN forum_categories c ON t.category_id = c.id
                WHERE 1=1
                ORDER BY t.created_at DESC LIMIT 100
            """)
            rows = cur.fetchall()
            topics = [{
                'id': r[0], 'title': r[1], 'category_id': r[2], 'category': r[3],
                'author': r[4], 'is_pinned': r[5] or False, 'is_locked': r[6] or False,
                'replies_count': r[7] or 0, 'created_at': json_serial(r[8])
            } for r in rows]
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(topics)}

        # PUT pin
        if action == 'pin' or (method == 'PUT' and 'pin' in path):
            topic_id = body.get('topic_id')
            is_pinned = body.get('is_pinned', True)
            cur.execute("UPDATE forum_topics SET is_pinned = %s WHERE id = %s", (is_pinned, topic_id))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

        # PUT lock
        if action == 'lock' or (method == 'PUT' and 'lock' in path):
            topic_id = body.get('topic_id')
            is_locked = body.get('is_locked', True)
            cur.execute("UPDATE forum_topics SET is_locked = %s WHERE id = %s", (is_locked, topic_id))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

        # PUT delete-topic
        if action == 'delete-topic' or (method == 'PUT' and 'delete-topic' in path):
            topic_id = body.get('topic_id')
            cur.execute("UPDATE forum_topics SET is_locked = TRUE WHERE id = %s", (topic_id,))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

        # GET categories
        if action == 'categories' or (method == 'GET' and 'categories' in path):
            cur.execute("SELECT id, name, description, icon, color, sort_order, topics_count, posts_count FROM forum_categories ORDER BY sort_order")
            rows = cur.fetchall()
            cats = [{'id': r[0], 'name': r[1], 'description': r[2], 'icon': r[3], 'color': r[4], 'sort_order': r[5], 'topics_count': r[6], 'posts_count': r[7]} for r in rows]
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(cats)}

        # POST create-category
        if action == 'create-category' or (method == 'POST' and 'categories' in path):
            if admin_role != 'admin':
                return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Только администратор'})}
            name = body.get('name', '').strip()
            desc = body.get('description', '')
            icon = body.get('icon', '⚡')
            color = body.get('color', '#f97316')
            if not name:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Название обязательно'})}
            cur.execute("INSERT INTO forum_categories (name, description, icon, color) VALUES (%s, %s, %s, %s) RETURNING id", (name, desc, icon, color))
            cat_id = cur.fetchone()[0]
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'category_id': cat_id})}

        # GET stats
        if action == 'stats' or (method == 'GET' and 'stats' in path):
            cur.execute("SELECT COUNT(*) FROM forum_users")
            users_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM forum_topics")
            topics_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM forum_posts")
            posts_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM forum_users WHERE is_banned = TRUE")
            banned_count = cur.fetchone()[0]
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'users_count': users_count,
                    'topics_count': topics_count,
                    'posts_count': posts_count,
                    'banned_count': banned_count
                })
            }

        return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        cur.close()
        conn.close()