"""Личные сообщения форума Грозы"""
import json
import os
import psycopg2
from datetime import datetime

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    'Content-Type': 'application/json'
}

SCHEMA = 't_p11081021_storm_forum_orange'

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'], options=f'-c search_path={SCHEMA},public')

def get_user(cur, session_id):
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
    """Личные сообщения между пользователями"""
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
        user = get_user(cur, session_id)
        if not user:
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Необходима авторизация'})}

        user_id = user[0]

        # GET inbox
        if action == 'inbox' or (method == 'GET' and 'inbox' in path):
            cur.execute("""
                SELECT m.id, m.subject, m.content, m.is_read, m.created_at,
                       u.username as from_user
                FROM forum_messages m
                JOIN forum_users u ON m.from_user_id = u.id
                WHERE m.to_user_id = %s
                ORDER BY m.created_at DESC LIMIT 50
            """, (user_id,))
            rows = cur.fetchall()
            msgs = [{
                'id': r[0], 'subject': r[1], 'content': r[2], 'is_read': r[3] or False,
                'created_at': json_serial(r[4]), 'from_user': r[5]
            } for r in rows]
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(msgs)}

        # GET sent
        if action == 'sent' or (method == 'GET' and 'sent' in path):
            cur.execute("""
                SELECT m.id, m.subject, m.content, m.is_read, m.created_at,
                       u.username as to_user
                FROM forum_messages m
                JOIN forum_users u ON m.to_user_id = u.id
                WHERE m.from_user_id = %s
                ORDER BY m.created_at DESC LIMIT 50
            """, (user_id,))
            rows = cur.fetchall()
            msgs = [{
                'id': r[0], 'subject': r[1], 'content': r[2], 'is_read': r[3] or False,
                'created_at': json_serial(r[4]), 'to_user': r[5]
            } for r in rows]
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(msgs)}

        # POST send
        if action == 'send' or (method == 'POST' and 'send' in path):
            to_username = body.get('to_username', '').strip()
            subject = body.get('subject', 'Без темы').strip()
            content = body.get('content', '').strip()

            if not to_username or not content:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Заполните поля'})}

            cur.execute("SELECT id FROM forum_users WHERE username = %s", (to_username,))
            to_user = cur.fetchone()
            if not to_user:
                return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пользователь не найден'})}

            to_user_id = to_user[0]
            if to_user_id == user_id:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Нельзя отправить себе'})}

            cur.execute(
                "INSERT INTO forum_messages (from_user_id, to_user_id, subject, content, created_at) VALUES (%s, %s, %s, %s, NOW()) RETURNING id",
                (user_id, to_user_id, subject, content)
            )
            msg_id = cur.fetchone()[0]
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'message_id': msg_id})}

        # PUT read
        if action == 'read' or (method == 'PUT' and 'read' in path):
            msg_id = body.get('message_id')
            cur.execute("UPDATE forum_messages SET is_read = TRUE WHERE id = %s AND to_user_id = %s", (msg_id, user_id))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

        # GET unread-count
        if action == 'unread-count' or (method == 'GET' and 'unread' in path):
            cur.execute("SELECT COUNT(*) FROM forum_messages WHERE to_user_id = %s AND is_read = FALSE", (user_id,))
            count = cur.fetchone()[0]
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'count': count})}

        return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        cur.close()
        conn.close()