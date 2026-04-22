import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
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

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.forum.categories().then(setCategories).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Icon name="LayoutGrid" size={28} className="text-primary" />
        <div>
          <h1 className="text-2xl font-black">Категории</h1>
          <p className="text-muted-foreground text-sm">Выберите раздел для просмотра тем</p>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="forum-card p-6 animate-pulse">
              <div className="h-8 w-8 bg-muted rounded mb-3" />
              <div className="h-4 bg-muted rounded w-2/3 mb-2" />
              <div className="h-3 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/categories/${cat.id}`}
              className="forum-card p-6 block group"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: cat.color + '20', border: `2px solid ${cat.color}40` }}
                >
                  {cat.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">{cat.description}</p>
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Icon name="MessageSquare" size={12} />
                      {cat.topics_count} тем
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="MessageCircle" size={12} />
                      {cat.posts_count} сообщений
                    </span>
                  </div>
                </div>
                <Icon name="ChevronRight" size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
