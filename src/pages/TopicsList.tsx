import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Icon from '@/components/ui/icon';

interface Topic {
  id: number;
  title: string;
  author: string;
  category_id: number;
  replies_count: number;
  views_count: number;
  last_post_at: string;
  created_at: string;
  is_pinned: boolean;
  is_locked: boolean;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  description: string;
}

export default function TopicsList() {
  const { categoryId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await api.forum.topics(categoryId).catch(() => []);
      setTopics(data);
      if (categoryId) {
        const cats = await api.forum.categories().catch(() => []);
        const cat = cats.find((c: Category) => c.id === Number(categoryId));
        setCategory(cat || null);
      }
      setLoading(false);
    };
    load();
  }, [categoryId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Link to="/categories" className="hover:text-primary transition-colors">Категории</Link>
          {category && (
            <>
              <Icon name="ChevronRight" size={14} />
              <span className="text-foreground">{category.icon} {category.name}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            {category ? (
              <><span>{category.icon}</span>{category.name}</>
            ) : (
              <><Icon name="MessageSquare" size={24} className="text-primary" />Все темы</>
            )}
          </h1>
          {category && <p className="text-muted-foreground text-sm mt-1">{category.description}</p>}
        </div>
        {user && (
          <Link
            to={categoryId ? `/topics/new?category=${categoryId}` : '/topics/new'}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Icon name="Plus" size={16} />
            Новая тема
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="forum-card p-4 animate-pulse flex gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {topics.length === 0 ? (
            <div className="forum-card p-12 text-center">
              <Icon name="MessageSquare" size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground text-lg mb-2">Тем пока нет</p>
              <p className="text-muted-foreground text-sm mb-6">Станьте первым, кто начнёт обсуждение!</p>
              {user ? (
                <Link to={categoryId ? `/topics/new?category=${categoryId}` : '/topics/new'} className="btn-primary inline-flex items-center gap-2">
                  <Icon name="Plus" size={16} />Создать тему
                </Link>
              ) : (
                <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                  <Icon name="LogIn" size={16} />Войти для создания
                </Link>
              )}
            </div>
          ) : (
            topics.map(topic => (
              <div
                key={topic.id}
                className="forum-card p-4 flex items-center gap-4 cursor-pointer"
                onClick={() => navigate(`/topics/${topic.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {topic.is_pinned && (
                      <span className="flex items-center gap-1 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-medium">
                        <Icon name="Pin" size={10} />Закреплено
                      </span>
                    )}
                    {topic.is_locked && (
                      <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">
                        <Icon name="Lock" size={10} />Закрыто
                      </span>
                    )}
                    <span className="font-semibold text-foreground hover:text-primary transition-colors">
                      {topic.title}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    от <span className="text-primary">{topic.author}</span> · {topic.created_at}
                    {topic.last_post_at && topic.last_post_at !== topic.created_at && (
                      <> · последнее {topic.last_post_at}</>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground shrink-0">
                  <span className="flex items-center gap-1">
                    <Icon name="MessageCircle" size={12} />
                    {topic.replies_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="Eye" size={12} />
                    {topic.views_count}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
