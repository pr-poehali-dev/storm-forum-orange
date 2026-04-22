import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

export default function Profile() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bio, setBio] = useState(user?.bio || '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div className="forum-card p-12 text-center max-w-md mx-auto">
        <Icon name="User" size={40} className="mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-bold mb-2">Требуется авторизация</h2>
        <div className="flex gap-3 justify-center mt-4">
          <Link to="/login" className="btn-primary">Войти</Link>
          <Link to="/register" className="px-4 py-2 rounded-lg border border-border font-semibold hover:bg-secondary transition-colors">Регистрация</Link>
        </div>
      </div>
    );
  }

  const roleColor = user.role === 'admin' ? 'text-red-400 bg-red-500/10' : user.role === 'moderator' ? 'text-blue-400 bg-blue-500/10' : 'text-muted-foreground bg-muted';
  const roleText = user.role === 'admin' ? 'Администратор' : user.role === 'moderator' ? 'Модератор' : 'Участник';

  const saveBio = async () => {
    setSaving(true);
    try {
      await api.auth.updateProfile(bio);
      await refresh();
      setEditing(false);
      toast({ title: 'Профиль обновлён!' });
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : 'Ошибка', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast({ title: 'Вы вышли из аккаунта' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="forum-card p-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-700 flex items-center justify-center text-4xl font-black text-white shrink-0">
            {user.username[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black">{user.username}</h1>
            <span className={`inline-block text-sm px-3 py-1 rounded-full font-medium mt-1 ${roleColor}`}>
              {roleText}
            </span>
            <div className="text-sm text-muted-foreground mt-2">{user.email}</div>
            <div className="text-xs text-muted-foreground mt-1">
              На форуме с {user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '—'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="forum-card p-4 text-center">
          <div className="text-3xl font-black text-primary">{user.posts_count || 0}</div>
          <div className="text-sm text-muted-foreground">Сообщений</div>
        </div>
        <div className="forum-card p-4 text-center">
          <div className="text-3xl font-black text-primary capitalize">{roleText}</div>
          <div className="text-sm text-muted-foreground">Статус</div>
        </div>
      </div>

      <div className="forum-card p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2"><Icon name="FileText" size={18} className="text-primary" />О себе</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-sm text-primary hover:underline flex items-center gap-1">
              <Icon name="Pencil" size={14} />Редактировать
            </button>
          )}
        </div>
        {editing ? (
          <>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Расскажите о себе..."
              className="w-full bg-input border border-border rounded-lg p-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none min-h-[100px]"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setEditing(false); setBio(user.bio || ''); }} className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors">Отмена</button>
              <button onClick={saveBio} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50">
                {saving && <Icon name="Loader2" size={14} className="animate-spin" />}
                Сохранить
              </button>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            {user.bio || 'Информация о себе не заполнена'}
          </p>
        )}
      </div>

      <div className="forum-card p-6 space-y-3">
        <h2 className="font-bold flex items-center gap-2"><Icon name="Settings" size={18} className="text-primary" />Действия</h2>
        <div className="flex flex-col gap-2">
          <Link to="/messages" className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors">
            <Icon name="Mail" size={18} className="text-primary" />
            <span>Личные сообщения</span>
            <Icon name="ChevronRight" size={16} className="ml-auto text-muted-foreground" />
          </Link>
          {(user.role === 'admin' || user.role === 'moderator') && (
            <Link to="/admin" className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors">
              <Icon name="Shield" size={18} className="text-orange-400" />
              <span>Панель администратора</span>
              <Icon name="ChevronRight" size={16} className="ml-auto text-muted-foreground" />
            </Link>
          )}
          <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 transition-colors text-red-400 w-full text-left">
            <Icon name="LogOut" size={18} />
            <span>Выйти из аккаунта</span>
          </button>
        </div>
      </div>
    </div>
  );
}
