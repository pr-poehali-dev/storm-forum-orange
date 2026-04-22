import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface Category {
  id: number;
  name: string;
  icon: string;
}

export default function NewTopic() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(searchParams.get('category') || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.forum.categories().then(setCategories).catch(() => {});
  }, []);

  if (!user) {
    return (
      <div className="forum-card p-12 text-center max-w-md mx-auto">
        <Icon name="Lock" size={40} className="mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-bold mb-2">Требуется авторизация</h2>
        <p className="text-muted-foreground mb-6">Войдите, чтобы создать тему</p>
        <Link to="/login" className="btn-primary inline-flex items-center gap-2">
          <Icon name="LogIn" size={16} />Войти
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !categoryId) {
      toast({ title: 'Заполните все поля', variant: 'destructive' });
      return;
    }
    if (title.trim().length < 5) {
      toast({ title: 'Название темы минимум 5 символов', variant: 'destructive' });
      return;
    }
    if (content.trim().length < 20) {
      toast({ title: 'Текст темы минимум 20 символов', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const data = await api.forum.createTopic(title.trim(), Number(categoryId), content.trim());
      toast({ title: 'Тема создана!' });
      navigate(`/topics/${data.topic_id}`);
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : 'Ошибка', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Icon name="Plus" size={24} className="text-primary" />
        <h1 className="text-2xl font-black">Новая тема</h1>
      </div>

      <form onSubmit={handleSubmit} className="forum-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Категория *</label>
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary"
          >
            <option value="">Выберите категорию...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Название темы *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Введите название темы..."
            className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
          />
          <div className="text-xs text-muted-foreground mt-1">{title.length} символов</div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Содержание *</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Расскажите подробнее..."
            className="w-full bg-input border border-border rounded-lg px-3 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none min-h-[200px]"
          />
          <div className="text-xs text-muted-foreground mt-1">{content.length} символов</div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg border border-border font-semibold hover:bg-secondary transition-colors">
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
            Создать тему
          </button>
        </div>
      </form>
    </div>
  );
}
