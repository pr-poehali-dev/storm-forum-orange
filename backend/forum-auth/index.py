"""Авторизация и регистрация на форуме Грозы"""
import json
import os
import hashlib
import secrets
import psycopg2
from datetime import datetime, timedelta

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    'Content-Type': 'application/json'
}

SCHEMA = 't_p11081021_storm_forum_orange'

def get_conn():
    conn = psycopg2.connect(os.environ['DATABASE_URL'], options=f'-c search_path={SCHEMA},public')
    return conn

def hash_password(password: str) -> str:
    salt = "groza_forum_salt_2024"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

def handler(event: dict, context) -> dict:
    """Регистрация, вход, выход, проверка сессии"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
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
        # POST ?action=register
        if action == 'register' or method == 'POST' and 'register' in event.get('path', ''):
            username = body.get('username', '').strip()
            email = body.get('email', '').strip()
            password = body.get('password', '')

            if not username or not email or not password:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Заполните все поля'})}

            if len(username) < 3:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Имя пользователя минимум 3 символа'})}

            if len(password) < 6:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пароль минимум 6 символов'})}

            cur.execute("SELECT id FROM forum_users WHERE username = %s OR email = %s", (username, email))
            if cur.fetchone():
                return {'statusCode': 409, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пользователь с таким именем или email уже существует'})}

            pwd_hash = hash_password(password)
            cur.execute(
                "INSERT INTO forum_users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id, username, role",
                (username, email, pwd_hash)
            )
            user = cur.fetchone()
            user_id, uname, role = user

            sess_id = secrets.token_hex(32)
            expires = datetime.now() + timedelta(days=30)
            cur.execute("INSERT INTO forum_sessions (id, user_id, expires_at) VALUES (%s, %s, %s)", (sess_id, user_id, expires))
            conn.commit()

            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({'session_id': sess_id, 'user': {'id': user_id, 'username': uname, 'role': role}})
            }

        # POST ?action=login
        if action == 'login' or method == 'POST' and 'login' in event.get('path', ''):
            username = body.get('username', '').strip()
            password = body.get('password', '')

            pwd_hash = hash_password(password)
            cur.execute(
                "SELECT id, username, role, is_banned FROM forum_users WHERE (username = %s OR email = %s) AND password_hash = %s",
                (username, username, pwd_hash)
            )
            user = cur.fetchone()
            if not user:
                return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неверный логин или пароль'})}

            user_id, uname, role, is_banned = user
            if is_banned:
                return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Ваш аккаунт заблокирован'})}

            sess_id = secrets.token_hex(32)
            expires = datetime.now() + timedelta(days=30)
            cur.execute("INSERT INTO forum_sessions (id, user_id, expires_at) VALUES (%s, %s, %s)", (sess_id, user_id, expires))
            cur.execute("UPDATE forum_users SET last_seen_at = NOW() WHERE id = %s", (user_id,))
            conn.commit()

            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({'session_id': sess_id, 'user': {'id': user_id, 'username': uname, 'role': role}})
            }

        # POST ?action=logout
        if action == 'logout' or method == 'POST' and 'logout' in event.get('path', ''):
            if session_id:
                cur.execute("UPDATE forum_sessions SET expires_at = NOW() WHERE id = %s", (session_id,))
                conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

        # GET ?action=me
        if action == 'me' or method == 'GET' and 'me' in event.get('path', ''):
            if not session_id:
                return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}

            cur.execute("""
                SELECT u.id, u.username, u.email, u.role, u.bio, u.posts_count, u.avatar_url, u.created_at
                FROM forum_sessions s
                JOIN forum_users u ON s.user_id = u.id
                WHERE s.id = %s AND s.expires_at > NOW()
            """, (session_id,))
            row = cur.fetchone()
            if not row:
                return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Сессия истекла'})}

            uid, uname, email, role, bio, posts_count, avatar_url, created_at = row
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'user': {
                        'id': uid, 'username': uname, 'email': email, 'role': role,
                        'bio': bio, 'posts_count': posts_count, 'avatar_url': avatar_url,
                        'created_at': str(created_at)
                    }
                })
            }

        # PUT ?action=profile
        if action == 'profile' or method == 'PUT' and 'profile' in event.get('path', ''):
            if not session_id:
                return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}

            cur.execute("SELECT user_id FROM forum_sessions WHERE id = %s AND expires_at > NOW()", (session_id,))
            row = cur.fetchone()
            if not row:
                return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Сессия истекла'})}

            user_id = row[0]
            bio = body.get('bio', '')
            cur.execute("UPDATE forum_users SET bio = %s WHERE id = %s", (bio, user_id))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        cur.close()
        conn.close()