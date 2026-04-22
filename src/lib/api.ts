const URLS = {
  auth: 'https://functions.poehali.dev/0a6597c5-995b-485a-93bb-795420c93729',
  data: 'https://functions.poehali.dev/00bb236a-58e3-4720-ab85-f796f4ee0afc',
  messages: 'https://functions.poehali.dev/54b8ae43-206c-4a3a-91ac-3ebd4604cb84',
  admin: 'https://functions.poehali.dev/b0d2c845-3ba0-4b6b-ae4b-1db0378cce6c',
};

function getSession(): string {
  return localStorage.getItem('session_id') || '';
}

async function req(url: string, method: string, params?: Record<string, string>, body?: object) {
  const u = new URL(url);
  if (params) Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const session = getSession();
  if (session) headers['X-Session-Id'] = session;
  const res = await fetch(u.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export const api = {
  auth: {
    register: (username: string, email: string, password: string) =>
      req(URLS.auth, 'POST', { action: 'register' }, { username, email, password }),
    login: (username: string, password: string) =>
      req(URLS.auth, 'POST', { action: 'login' }, { username, password }),
    logout: () => req(URLS.auth, 'POST', { action: 'logout' }),
    me: () => req(URLS.auth, 'GET', { action: 'me' }),
    updateProfile: (bio: string) => req(URLS.auth, 'PUT', { action: 'profile' }, { bio }),
  },
  forum: {
    categories: () => req(URLS.data, 'GET', { action: 'categories' }),
    topics: (category_id?: string) =>
      req(URLS.data, 'GET', { action: 'topics', ...(category_id ? { category_id } : {}) }),
    topic: (topic_id: string) => req(URLS.data, 'GET', { action: 'topics', topic_id }),
    createTopic: (title: string, category_id: number, content: string) =>
      req(URLS.data, 'POST', { action: 'create-topic' }, { title, category_id, content }),
    posts: (topic_id: string) => req(URLS.data, 'GET', { action: 'posts', topic_id }),
    reply: (topic_id: number, content: string) =>
      req(URLS.data, 'POST', { action: 'reply' }, { topic_id, content }),
    search: (q: string) => req(URLS.data, 'GET', { action: 'search', q }),
    stats: () => req(URLS.data, 'GET', { action: 'stats' }),
    recentTopics: () => req(URLS.data, 'GET', { action: 'recent' }),
  },
  messages: {
    inbox: () => req(URLS.messages, 'GET', { action: 'inbox' }),
    sent: () => req(URLS.messages, 'GET', { action: 'sent' }),
    send: (to_username: string, subject: string, content: string) =>
      req(URLS.messages, 'POST', { action: 'send' }, { to_username, subject, content }),
    markRead: (message_id: number) =>
      req(URLS.messages, 'PUT', { action: 'read' }, { message_id }),
    unreadCount: () => req(URLS.messages, 'GET', { action: 'unread-count' }),
  },
  admin: {
    stats: () => req(URLS.admin, 'GET', { action: 'stats' }),
    users: () => req(URLS.admin, 'GET', { action: 'users' }),
    topics: () => req(URLS.admin, 'GET', { action: 'topics' }),
    categories: () => req(URLS.admin, 'GET', { action: 'categories' }),
    banUser: (user_id: number, is_banned: boolean) =>
      req(URLS.admin, 'PUT', { action: 'ban' }, { user_id, is_banned }),
    setRole: (user_id: number, role: string) =>
      req(URLS.admin, 'PUT', { action: 'set-role' }, { user_id, role }),
    pinTopic: (topic_id: number, is_pinned: boolean) =>
      req(URLS.admin, 'PUT', { action: 'pin' }, { topic_id, is_pinned }),
    lockTopic: (topic_id: number, is_locked: boolean) =>
      req(URLS.admin, 'PUT', { action: 'lock' }, { topic_id, is_locked }),
    deleteTopic: (topic_id: number) =>
      req(URLS.admin, 'PUT', { action: 'delete-topic' }, { topic_id }),
    createCategory: (name: string, description: string, icon: string, color: string) =>
      req(URLS.admin, 'POST', { action: 'create-category' }, { name, description, icon, color }),
  },
};
