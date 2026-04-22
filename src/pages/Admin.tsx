import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface Stats { users_count: number; topics_count: number; posts_count: number; banned_count: number; }
interface User { id: number; username: string; email: string; role: string; posts_count: number; is_banned: boolean; created_at: string; last_seen_at: string; }
interface Topic { id: number; title: string; author: string; category: string; is_pinned: boolean; is_locked: boolean; replies_count: number; created_at: string; }
interface Category { id: number; name: string; icon: string; description: string; topics_count: number; posts_count: number; }

type Tab = 'stats' | 'users' | 'topics' | 'categories';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', description: '', icon: '⚡', color: '#f97316' });
  const [showNewCat, setShowNewCat] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      navigate('/');
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'stats') setStats(await api.admin.stats());
      if (tab === 'users') setUsers(await api.admin.users());
      if (tab === 'topics') setTopics(await api.admin.topics());
      if (tab === 'categories') setCategories(await api.admin.categories());
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : 'Ошибка загрузки', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const action = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast({ title: msg });
      loadData();
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : 'Ошибка', variant: 'destructive' });
    }
  };

  const createCategory = async () => {
    if (!newCat.name.trim()) { toast({ title: 'Введите название', variant: 'destructive' }); return; }
    await action(() => api.admin.createCategory(newCat.name, newCat.description, newCat.icon, newCat.color), 'Категория создана!');
    setNewCat({ name: '', description: '', icon: '⚡', color: '#f97316' });
    setShowNewCat(false);
  };

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return null;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'stats', label: 'Статистика', icon: 'BarChart3' },
    { key: 'users', label: 'Пользователи', icon: 'Users' },
    { key: 'topics', label: 'Темы', icon: 'MessageSquare' },
    { key: 'categories', label: 'Категории', icon: 'LayoutGrid' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
          <Icon name="Shield" size={22} className="text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Панель администратора</h1>
          <p className="text-muted-foreground text-sm">Управление форумом Грозы</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-primary text-white glow-orange-sm' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
          >
            <Icon name={t.icon as 'Users'} size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-8"><Icon name="Loader2" size={32} className="mx-auto animate-spin text-primary" /></div>}

      {!loading && tab === 'stats' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Пользователей', value: stats.users_count, icon: 'Users', color: 'text-blue-400' },
            { label: 'Тем', value: stats.topics_count, icon: 'MessageSquare', color: 'text-orange-400' },
            { label: 'Сообщений', value: stats.posts_count, icon: 'MessageCircle', color: 'text-green-400' },
            { label: 'Заблокировано', value: stats.banned_count, icon: 'Ban', color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="forum-card p-5 text-center">
              <Icon name={s.icon as 'Users'} size={28} className={`mx-auto mb-2 ${s.color}`} />
              <div className="text-3xl font-black">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'users' && (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="forum-card p-4 flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0">
                {u.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{u.username}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : u.role === 'moderator' ? 'bg-blue-500/20 text-blue-400' : 'bg-muted text-muted-foreground'}`}>
                    {u.role}
                  </span>
                  {u.is_banned && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Заблокирован</span>}
                </div>
                <div className="text-xs text-muted-foreground">{u.email} · {u.posts_count} сообщений · {u.created_at}</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {user.role === 'admin' && u.id !== user.id && (
                  <select
                    value={u.role}
                    onChange={e => action(() => api.admin.setRole(u.id, e.target.value), 'Роль изменена')}
                    className="bg-input border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="user">Участник</option>
                    <option value="moderator">Модератор</option>
                    <option value="admin">Администратор</option>
                  </select>
                )}
                {u.id !== user.id && (
                  <button
                    onClick={() => action(() => api.admin.banUser(u.id, !u.is_banned), u.is_banned ? 'Разблокирован' : 'Заблокирован')}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${u.is_banned ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                  >
                    {u.is_banned ? 'Разблокировать' : 'Заблокировать'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'topics' && (
        <div className="space-y-2">
          {topics.map(t => (
            <div key={t.id} className="forum-card p-4 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.author} · {t.category} · {t.replies_count} ответов · {t.created_at}</div>
                <div className="flex gap-2 mt-1">
                  {t.is_pinned && <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">Закреплено</span>}
                  {t.is_locked && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Закрыто</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => action(() => api.admin.pinTopic(t.id, !t.is_pinned), t.is_pinned ? 'Откреплено' : 'Закреплено')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${t.is_pinned ? 'bg-orange-500/30 text-orange-300' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                >
                  <Icon name="Pin" size={12} />
                </button>
                <button
                  onClick={() => action(() => api.admin.lockTopic(t.id, !t.is_locked), t.is_locked ? 'Открыто' : 'Закрыто')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${t.is_locked ? 'bg-red-500/30 text-red-300' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                >
                  <Icon name={t.is_locked ? 'Unlock' : 'Lock'} size={12} />
                </button>
                <button
                  onClick={() => { if (confirm('Удалить тему?')) action(() => api.admin.deleteTopic(t.id), 'Тема удалена'); }}
                  className="px-3 py-1 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <Icon name="Trash2" size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'categories' && (
        <div className="space-y-4">
          {user.role === 'admin' && (
            <div>
              <button
                onClick={() => setShowNewCat(!showNewCat)}
                className="btn-primary flex items-center gap-2"
              >
                <Icon name="Plus" size={16} />
                Новая категория
              </button>
              {showNewCat && (
                <div className="forum-card p-5 mt-3 space-y-3 max-w-md">
                  <h3 className="font-bold">Создать категорию</h3>
                  <input value={newCat.name} onChange={e => setNewCat(n => ({ ...n, name: e.target.value }))} placeholder="Название *" className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary" />
                  <input value={newCat.description} onChange={e => setNewCat(n => ({ ...n, description: e.target.value }))} placeholder="Описание" className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary" />
                  <div className="flex gap-3">
                    <input value={newCat.icon} onChange={e => setNewCat(n => ({ ...n, icon: e.target.value }))} placeholder="Иконка" className="w-24 bg-input border border-border rounded-lg px-3 py-2.5 text-foreground text-center focus:outline-none focus:border-primary" />
                    <input type="color" value={newCat.color} onChange={e => setNewCat(n => ({ ...n, color: e.target.value }))} className="w-12 h-10 rounded-lg border border-border bg-input cursor-pointer" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={createCategory} className="btn-primary flex items-center gap-2"><Icon name="Check" size={14} />Создать</button>
                    <button onClick={() => setShowNewCat(false)} className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors">Отмена</button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {categories.map(cat => (
              <div key={cat.id} className="forum-card p-4 flex items-start gap-3">
                <span className="text-3xl">{cat.icon}</span>
                <div>
                  <div className="font-semibold">{cat.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{cat.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">{cat.topics_count} тем · {cat.posts_count} сообщений</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
