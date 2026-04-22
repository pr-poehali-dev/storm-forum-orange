import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Icon from '@/components/ui/icon';

const navItems = [
  { to: '/', label: 'Главная', icon: 'Home' },
  { to: '/categories', label: 'Категории', icon: 'LayoutGrid' },
  { to: '/topics', label: 'Темы', icon: 'MessageSquare' },
  { to: '/search', label: 'Поиск', icon: 'Search' },
  { to: '/rules', label: 'Правила', icon: 'BookOpen' },
  { to: '/contacts', label: 'Контакты', icon: 'Headphones' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background lightning-bg">
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 font-black text-xl" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <span className="text-2xl">⚡</span>
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              Форум Грозы
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-link ${location.pathname === item.to ? 'active' : ''}`}
              >
                <Icon name={item.icon} size={16} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/messages" className="nav-link relative">
                  <Icon name="Mail" size={18} />
                  <span className="hidden sm:inline">Сообщения</span>
                </Link>
                <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                    {user.username[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">{user.username}</span>
                  {user.role === 'admin' && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">ADM</span>}
                  {user.role === 'moderator' && <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">MOD</span>}
                </Link>
                {(user.role === 'admin' || user.role === 'moderator') && (
                  <Link to="/admin" className="nav-link">
                    <Icon name="Shield" size={16} />
                    <span className="hidden sm:inline">Админка</span>
                  </Link>
                )}
                <button onClick={handleLogout} className="nav-link text-muted-foreground hover:text-red-400">
                  <Icon name="LogOut" size={16} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Войти</Link>
                <Link to="/register" className="btn-primary text-sm">Регистрация</Link>
              </>
            )}
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              <Icon name={mobileOpen ? 'X' : 'Menu'} size={20} />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-1">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-link ${location.pathname === item.to ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon name={item.icon} size={16} />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-border mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground text-sm">
          <span className="text-orange-500 font-bold">⚡ Форум Грозы</span> — место где рождаются идеи · {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}