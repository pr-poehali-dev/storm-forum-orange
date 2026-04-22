import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Icon from '@/components/ui/icon';

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  topics_count: number;
  posts_count: number;
}

interface Topic {
  id: number;
  title: string;
  author: string;
  category_id: number;
  replies_count: number;
  views_count: number;
  last_post_at: string;
  is_pinned: boolean;
}

interface Stats {
  users_count: number;
  topics_count: number;
  posts_count: number;
}

export default function Home() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.forum.categories().then(setCategories).catch(() => {});
    api.forum.topics().then(data => setTopics(data.slice(0, 10))).catch(() => {});
    api.forum.stats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-900/30 via-card to-card border border-orange-500/20 p-8 glow-orange-sm">
        <div className="absolute top-0 right-0 text-[200px] opacity-5 leading-none select-none">⚡</div>
        <div className="relative">
          <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Форум Грозы
          </h1>
          <p className="text-muted-foreground text-lg mb-6 max-w-xl">
            Место где рождаются идеи, ведутся споры и находятся ответы. Присоединяйся к сообществу!
          </p>
          {!user && (
            <div className="flex gap-3">
              <Link to="/register" className="btn-primary inline-flex items-center gap-2">
                <Icon name="UserPlus" size={18} />
                Зарегистрироваться
              </Link>
              <Link to="/login" className="px-4 py-2 rounded-lg border border-border text-foreground font-semibold hover:bg-secondary transition-colors inline-flex items-center gap-2">
                <Icon name="LogIn" size={18} />
                Войти
              </Link>
            </div>
          )}
          {user && (
            <Link to="/topics/new" className="btn-primary inline-flex items-center gap-2">
              <Icon name="Plus" size={18} />
              Создать тему
            </Link>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Участников', value: stats.users_count, icon: 'Users', color: 'text-orange-400' },
            { label: 'Тем', value: stats.topics_count, icon: 'MessageSquare', color: 'text-orange-500' },
            { label: 'Сообщений', value: stats.posts_count, icon: 'MessagesSquare', color: 'text-orange-600' },
          ].map(s => (
            <div key={s.label} className="forum-card p-4 text-center">
              <Icon name={s.icon as 'Users'} size={28} className={`mx-auto mb-2 ${s.color}`} />
              <div className="text-2xl font-black text-foreground">{s.value.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Icon name="LayoutGrid" size={20} className="text-primary" />
            Категории
          </h2>
          <Link to="/categories" className="text-sm text-primary hover:underline">Все категории →</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map(cat => (
            <Link key={cat.id} to={`/categories/${cat.id}`} className="forum-card p-4 block">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground">{cat.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{cat.description}</div>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{cat.topics_count} тем</span>
                    <span>{cat.posts_count} сообщений</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Icon name="Clock" size={20} className="text-primary" />
            Последние темы
          </h2>
          <Link to="/topics" className="text-sm text-primary hover:underline">Все темы →</Link>
        </div>
        <div className="space-y-2">
          {topics.map(topic => (
            <Link key={topic.id} to={`/topics/${topic.id}`} className="forum-card p-4 flex items-center gap-4 block">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {topic.is_pinned && <Icon name="Pin" size={14} className="text-orange-400 shrink-0" />}
                  <span className="font-medium text-foreground truncate">{topic.title}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  от <span className="text-primary">{topic.author}</span> · {topic.last_post_at}
                </div>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground shrink-0">
                <span className="flex items-center gap-1"><Icon name="MessageCircle" size={12} />{topic.replies_count}</span>
                <span className="flex items-center gap-1"><Icon name="Eye" size={12} />{topic.views_count}</span>
              </div>
            </Link>
          ))}
          {topics.length === 0 && (
            <div className="forum-card p-8 text-center text-muted-foreground">
              <Icon name="MessageSquare" size={40} className="mx-auto mb-3 opacity-30" />
              <p>Тем пока нет. Будь первым!</p>
              {user && <Link to="/topics/new" className="btn-primary inline-flex mt-4 items-center gap-2"><Icon name="Plus" size={16} />Создать тему</Link>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
