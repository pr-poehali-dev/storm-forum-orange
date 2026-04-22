import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface Topic {
  id: number;
  title: string;
  author: string;
  category_id: number;
  is_pinned: boolean;
  is_locked: boolean;
  views_count: number;
  replies_count: number;
  created_at: string;
}

interface Post {
  id: number;
  content: string;
  author: string;
  author_id: number;
  author_role: string;
  author_posts: number;
  created_at: string;
}

function roleLabel(role: string) {
  if (role === 'admin') return <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Администратор</span>;
  if (role === 'moderator') return <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Модератор</span>;
  return <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Участник</span>;
}

export default function TopicView() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [t, p] = await Promise.all([
        api.forum.topic(id),
        api.forum.posts(id)
      ]);
      setTopic(t);
      setPosts(p);
    } catch {
      navigate('/topics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleReply = async () => {
    if (!reply.trim() || !id) return;
    if (reply.trim().length < 5) {
      toast({ title: 'Слишком короткий ответ', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      await api.forum.reply(Number(id), reply.trim());
      setReply('');
      await load();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      toast({ title: 'Ответ опубликован!' });
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : 'Ошибка', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-2/3" />
        <div className="forum-card p-6 space-y-3">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-4/5" />
        </div>
      </div>
    );
  }

  if (!topic) return null;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 flex-wrap">
          <Link to="/categories" className="hover:text-primary transition-colors">Категории</Link>
          <Icon name="ChevronRight" size={14} />
          <Link to={`/categories/${topic.category_id}`} className="hover:text-primary transition-colors">Раздел</Link>
          <Icon name="ChevronRight" size={14} />
          <span className="text-foreground truncate max-w-xs">{topic.title}</span>
        </div>

        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {topic.is_pinned && (
                <span className="flex items-center gap-1 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                  <Icon name="Pin" size={10} />Закреплено
                </span>
              )}
              {topic.is_locked && (
                <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                  <Icon name="Lock" size={10} />Закрыто
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black mt-1">{topic.title}</h1>
            <div className="text-sm text-muted-foreground mt-1 flex gap-3 flex-wrap">
              <span>автор: <span className="text-primary">{topic.author}</span></span>
              <span className="flex items-center gap-1"><Icon name="Eye" size={12} />{topic.views_count} просмотров</span>
              <span className="flex items-center gap-1"><Icon name="MessageCircle" size={12} />{topic.replies_count} ответов</span>
              <span>{topic.created_at}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map((post, idx) => (
          <div key={post.id} className={`forum-card p-0 overflow-hidden flex flex-col sm:flex-row ${idx === 0 ? 'border-orange-500/30' : ''}`}>
            <div className="sm:w-40 bg-secondary/50 p-4 flex flex-col items-center text-center border-b sm:border-b-0 sm:border-r border-border">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-xl font-black mb-2">
                {post.author[0].toUpperCase()}
              </div>
              <div className="font-semibold text-sm">{post.author}</div>
              <div className="mt-1">{roleLabel(post.author_role)}</div>
              <div className="text-xs text-muted-foreground mt-2">{post.author_posts} сообщений</div>
            </div>
            <div className="flex-1 p-4">
              <div className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                <Icon name="Clock" size={12} />
                {post.created_at}
                {idx === 0 && <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-xs ml-1">Первый пост</span>}
              </div>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{post.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {user && !topic.is_locked && (
        <div className="forum-card p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Icon name="Reply" size={18} className="text-primary" />
            Ваш ответ
          </h3>
          <textarea
            className="w-full bg-input border border-border rounded-lg p-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none min-h-[120px]"
            placeholder="Напишите ваш ответ..."
            value={reply}
            onChange={e => setReply(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{reply.length} символов</span>
            <button
              onClick={handleReply}
              disabled={sending || !reply.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
              Отправить
            </button>
          </div>
        </div>
      )}

      {topic.is_locked && (
        <div className="forum-card p-4 text-center text-muted-foreground">
          <Icon name="Lock" size={24} className="mx-auto mb-2 text-red-400" />
          <p>Эта тема закрыта для ответов</p>
        </div>
      )}

      {!user && (
        <div className="forum-card p-6 text-center">
          <p className="text-muted-foreground mb-4">Войдите, чтобы оставить ответ</p>
          <div className="flex gap-3 justify-center">
            <Link to="/login" className="btn-primary">Войти</Link>
            <Link to="/register" className="px-4 py-2 rounded-lg border border-border font-semibold hover:bg-secondary transition-colors">Регистрация</Link>
          </div>
        </div>
      )}
    </div>
  );
}
