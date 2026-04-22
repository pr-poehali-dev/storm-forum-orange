import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const from = (location.state as { from?: string })?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username, password);
        toast({ title: 'Добро пожаловать!' });
      } else {
        await register(username, email, password);
        toast({ title: 'Аккаунт создан! Добро пожаловать!' });
      }
      navigate(from, { replace: true });
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : 'Ошибка', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-3xl font-black mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <span>⚡</span>
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              Форум Грозы
            </span>
          </Link>
          <h1 className="text-2xl font-bold">{mode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}</h1>
          <p className="text-muted-foreground mt-1">
            {mode === 'login' ? 'Войдите, чтобы участвовать в обсуждениях' : 'Присоединяйтесь к сообществу Форума Грозы'}
          </p>
        </div>

        <div className="forum-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                {mode === 'login' ? 'Логин или email' : 'Имя пользователя'}
              </label>
              <div className="relative">
                <Icon name="User" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={mode === 'login' ? 'Ваш логин или email' : 'Придумайте имя пользователя'}
                  className="w-full bg-input border border-border rounded-lg pl-9 pr-3 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <div className="relative">
                  <Icon name="Mail" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-input border border-border rounded-lg pl-9 pr-3 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block">Пароль</label>
              <div className="relative">
                <Icon name="Lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Минимум 6 символов' : 'Ваш пароль'}
                  className="w-full bg-input border border-border rounded-lg pl-9 pr-10 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Icon name={showPass ? 'EyeOff' : 'Eye'} size={16} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Icon name="Loader2" size={18} className="animate-spin" />
              ) : (
                <Icon name={mode === 'login' ? 'LogIn' : 'UserPlus'} size={18} />
              )}
              {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-border text-center text-sm text-muted-foreground">
            {mode === 'login' ? (
              <>Нет аккаунта? <Link to="/register" className="text-primary hover:underline font-medium">Зарегистрироваться</Link></>
            ) : (
              <>Уже есть аккаунт? <Link to="/login" className="text-primary hover:underline font-medium">Войти</Link></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
