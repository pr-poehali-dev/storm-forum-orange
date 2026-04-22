import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface Message {
  id: number;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  from_user?: string;
  to_user?: string;
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);
  const [toUser, setToUser] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setSelected(null);
    try {
      const data = tab === 'inbox' ? await api.messages.inbox() : tab === 'sent' ? await api.messages.sent() : [];
      setMessages(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (tab !== 'compose') load(); }, [tab, user]);

  const openMessage = async (msg: Message) => {
    setSelected(msg);
    if (!msg.is_read && tab === 'inbox') {
      await api.messages.markRead(msg.id).catch(() => {});
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toUser.trim() || !content.trim()) {
      toast({ title: 'Заполните все поля', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      await api.messages.send(toUser.trim(), subject || 'Без темы', content.trim());
      toast({ title: 'Сообщение отправлено!' });
      setToUser(''); setSubject(''); setContent('');
      setTab('sent');
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : 'Ошибка', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="forum-card p-12 text-center max-w-md mx-auto">
        <Icon name="Mail" size={40} className="mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-bold mb-4">Требуется авторизация</h2>
        <Link to="/login" className="btn-primary">Войти</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Icon name="Mail" size={24} className="text-primary" />
        <h1 className="text-2xl font-black">Личные сообщения</h1>
      </div>

      <div className="flex gap-2 border-b border-border pb-4">
        {(['inbox', 'sent', 'compose'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            <Icon name={t === 'inbox' ? 'Inbox' : t === 'sent' ? 'SendHorizonal' : 'PenSquare'} size={16} />
            {t === 'inbox' ? 'Входящие' : t === 'sent' ? 'Отправленные' : 'Написать'}
          </button>
        ))}
      </div>

      {tab === 'compose' ? (
        <div className="forum-card p-6 max-w-lg">
          <form onSubmit={sendMessage} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Кому</label>
              <input
                value={toUser}
                onChange={e => setToUser(e.target.value)}
                placeholder="Имя пользователя"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Тема</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Тема сообщения"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Сообщение</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Текст сообщения..."
                className="w-full bg-input border border-border rounded-lg px-3 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none min-h-[150px]"
              />
            </div>
            <button type="submit" disabled={sending} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              {sending ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
              Отправить
            </button>
          </form>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            {loading && <div className="text-center py-8 text-muted-foreground"><Icon name="Loader2" size={24} className="mx-auto animate-spin" /></div>}
            {!loading && messages.length === 0 && (
              <div className="forum-card p-8 text-center text-muted-foreground">
                <Icon name="MailOpen" size={32} className="mx-auto mb-3 opacity-40" />
                <p>{tab === 'inbox' ? 'Входящих сообщений нет' : 'Отправленных сообщений нет'}</p>
              </div>
            )}
            {messages.map(msg => (
              <div
                key={msg.id}
                onClick={() => openMessage(msg)}
                className={`forum-card p-4 cursor-pointer ${selected?.id === msg.id ? 'border-primary/50' : ''} ${!msg.is_read && tab === 'inbox' ? 'border-orange-500/30' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!msg.is_read && tab === 'inbox' && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      <span className="font-medium text-sm truncate">{msg.subject}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {tab === 'inbox' ? `от ${msg.from_user}` : `кому ${msg.to_user}`}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">{msg.created_at}</div>
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div className="forum-card p-5">
              <h3 className="font-bold text-lg mb-1">{selected.subject}</h3>
              <div className="text-xs text-muted-foreground mb-4">
                {tab === 'inbox' ? `от ${selected.from_user}` : `кому ${selected.to_user}`} · {selected.created_at}
              </div>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{selected.content}</p>
              {tab === 'inbox' && (
                <button
                  onClick={() => { setTab('compose'); setToUser(selected.from_user || ''); setSubject(`Re: ${selected.subject}`); }}
                  className="mt-4 flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Icon name="Reply" size={14} />Ответить
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
