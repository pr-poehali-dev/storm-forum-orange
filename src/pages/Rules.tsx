import Icon from '@/components/ui/icon';

const rules = [
  {
    num: 1,
    title: 'Уважение к участникам',
    text: 'Общайтесь вежливо и уважительно. Оскорбления, угрозы, дискриминация по любому признаку — повод для немедленной блокировки.'
  },
  {
    num: 2,
    title: 'Публикация по теме',
    text: 'Размещайте сообщения в соответствующих разделах. Не создавайте дублирующие темы — сначала воспользуйтесь поиском.'
  },
  {
    num: 3,
    title: 'Запрет спама и рекламы',
    text: 'Запрещены спам, навязчивая реклама, массовое цитирование бессмысленных сообщений и флуд. За нарушение — бан.'
  },
  {
    num: 4,
    title: 'Запрет NSFW-контента',
    text: 'Публикация материалов для взрослых, пропаганда насилия, нелегального контента строго запрещена.'
  },
  {
    num: 5,
    title: 'Авторские права',
    text: 'Публикуя чужой материал, указывайте источник. Не нарушайте авторские права.'
  },
  {
    num: 6,
    title: 'Конструктивная критика',
    text: 'Критика должна быть аргументированной и конструктивной. Троллинг и провокации не приветствуются.'
  },
  {
    num: 7,
    title: 'Правила русского языка',
    text: 'Старайтесь писать грамотно. Использование транслита и чрезмерного сленга нежелательно.'
  },
  {
    num: 8,
    title: 'Одобрение решений администрации',
    text: 'Решения модераторов и администрации окончательны. Если вы не согласны — используйте раздел поддержки.'
  },
];

export default function Rules() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Icon name="BookOpen" size={28} className="text-primary" />
        <div>
          <h1 className="text-2xl font-black">Правила форума</h1>
          <p className="text-muted-foreground text-sm">Обязательны к прочтению для всех участников</p>
        </div>
      </div>

      <div className="forum-card p-6 border-orange-500/30 bg-orange-500/5">
        <div className="flex gap-3">
          <Icon name="AlertTriangle" size={24} className="text-orange-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-orange-300 mb-1">Важное предупреждение</h3>
            <p className="text-sm text-muted-foreground">
              Незнание правил не освобождает от ответственности. Нарушение правил влечёт предупреждение, 
              ограничение возможностей или постоянную блокировку аккаунта.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {rules.map(rule => (
          <div key={rule.num} className="forum-card p-5 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black text-lg shrink-0">
              {rule.num}
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-1">{rule.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{rule.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="forum-card p-6 text-center">
        <Icon name="CheckCircle" size={32} className="mx-auto mb-3 text-green-400" />
        <h3 className="font-bold mb-2">Регистрируясь на форуме, вы принимаете эти правила</h3>
        <p className="text-sm text-muted-foreground">
          Вопросы по правилам можно задать в разделе{' '}
          <a href="/contacts" className="text-primary hover:underline">Контакты поддержки</a>
        </p>
      </div>
    </div>
  );
}
