import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const contacts = [
  { icon: 'Mail', label: 'Email поддержки', value: 'support@forum-grom.ru', href: 'mailto:support@forum-grom.ru' },
  { icon: 'MessageCircle', label: 'Telegram', value: '@ForumGroza', href: 'https://t.me/ForumGroza' },
  { icon: 'Clock', label: 'Время ответа', value: 'До 24 часов в рабочие дни', href: null },
];

export default function Contacts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: user?.username || '', email: user?.email || '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: 'Заполните все обязательные поля', variant: 'destructive' });
      return;
    }
    setSending(true);
    await new Promise(r => setTimeout(r, 1000));
    setSending(false);
    toast({ title: 'Сообщение отправлено! Мы ответим вам в ближайшее время.' });
    setForm(f => ({ ...f, subject: '', message: '' }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Icon name="Headphones" size={28} className="text-primary" />
        <div>
          <h1 className="text-2xl font-black">Контакты поддержки</h1>
          <p className="text-muted-foreground text-sm">Мы всегда готовы помочь</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {contacts.map(c => (
          <div key={c.label} className="forum-card p-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Icon name={c.icon as 'Mail'} size={24} className="text-primary" />
            </div>
            <div className="text-sm text-muted-foreground mb-1">{c.label}</div>
            {c.href ? (
              <a href={c.href} className="font-semibold text-primary hover:underline break-all">{c.value}</a>
            ) : (
              <div className="font-semibold text-foreground">{c.value}</div>
            )}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="forum-card p-6 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Icon name="Send" size={20} className="text-primary" />
            Написать нам
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Имя *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ваше имя"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Тема</label>
              <input
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Тема обращения"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Сообщение *</label>
              <textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Опишите вашу проблему или вопрос..."
                className="w-full bg-input border border-border rounded-lg px-3 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none min-h-[120px]"
              />
            </div>
            <button type="submit" disabled={sending} className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
              {sending ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
              Отправить
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="forum-card p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Icon name="HelpCircle" size={18} className="text-primary" />Часто задаваемые вопросы</h3>
            <div className="space-y-3">
              {[
                { q: 'Как восстановить пароль?', a: 'Свяжитесь с нами через форму, указав email аккаунта.' },
                { q: 'Как сообщить о нарушении?', a: 'Напишите в поддержку с указанием ссылки на нарушение.' },
                { q: 'Как стать модератором?', a: 'Будьте активным участником форума и подайте заявку.' },
                { q: 'Почему мой аккаунт заблокирован?', a: 'Обратитесь в поддержку для разъяснений.' },
              ].map(faq => (
                <div key={faq.q} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="font-medium text-sm mb-1">{faq.q}</div>
                  <div className="text-sm text-muted-foreground">{faq.a}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="forum-card p-5 border-orange-500/20 bg-orange-500/5">
            <h3 className="font-bold mb-2 text-orange-300 flex items-center gap-2">
              <Icon name="Zap" size={18} />Быстрый ответ
            </h3>
            <p className="text-sm text-muted-foreground">
              Для срочных вопросов пишите напрямую в Telegram. Там мы отвечаем быстрее всего.
            </p>
            <a href="https://t.me/ForumGroza" className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <Icon name="MessageCircle" size={14} />Открыть Telegram →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
