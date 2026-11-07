import { useRef, useState } from 'react'
import { Switch, SegmentedControl } from 'glisse'
import { PieChart, History, ChevronRight, Snowflake, Globe, Bell, Palette, Gauge, Sparkles, Repeat, LineChart, ShieldAlert, Link2, Timer, RotateCcw, ShieldCheck, FileText, Landmark, Coins, CreditCard, Bot } from 'lucide-react'
import { useStore } from '../store.jsx'
import { GOALS, PARTNERS, CURRENCIES } from '../lib/mock.js'
import { kzt } from '../lib/format.js'
import { Card, Button, Section } from '../components/ui.jsx'

const CB_LABEL = { gold: 'Золото', btc: 'BTC', kzt: 'Золото' }
const THEMES = [{ value: 'system', label: 'Авто' }, { value: 'light', label: 'Светлая' }, { value: 'dark', label: 'Тёмная' }]
const RISKS = [{ value: 'conservative', label: 'Низкий' }, { value: 'moderate', label: 'Средний' }, { value: 'active', label: 'Высокий' }]

// Строка настройки: иконка, название, подпись, справа значение или переключатель
function Item({ icon: Icon, title, sub, right, below, onClick, tone }) {
  const body = (
    <>
      <div className="flex items-center gap-3">
        <span className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${tone || 'bg-ink/6'}`}><Icon size={17} /></span>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium">{title}</div>
          {sub && <div className="text-[12px] text-mute leading-snug">{sub}</div>}
        </div>
        {right}
        {onClick && <ChevronRight size={18} className="text-mute shrink-0" />}
      </div>
      {below && <div className="mt-3 pl-12">{below}</div>}
    </>
  )
  return onClick
    ? <button onClick={onClick} className="w-full text-left py-3 border-b border-line last:border-0">{body}</button>
    : <div className="py-3 border-b border-line last:border-0">{body}</div>
}

export default function Profile({ nav }) {
  const { state, dispatch, totals, money } = useStore()
  const s = state.settings
  const set = (key) => (value) => dispatch({ type: 'setting', key, value })
  const [confirmReset, setConfirmReset] = useState(false)
  const taps = useRef({ n: 0, t: 0 })
  const goal = GOALS.find((g) => g.id === state.goal)
  const connected = PARTNERS.filter((p) => state.partners[p.id]).length

  // 5 быстрых нажатий на версию открывают режим жюри
  const tapVersion = () => {
    const now = Date.now()
    taps.current = now - taps.current.t < 600 ? { n: taps.current.n + 1, t: now } : { n: 1, t: now }
    if (taps.current.n >= 5) { taps.current = { n: 0, t: 0 }; nav.open('jury') }
  }

  return (
    <div className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-6 flex flex-col gap-5">
      <header className="flex items-center gap-3 px-1">
        <span className="w-14 h-14 rounded-full bg-vault text-white grid place-items-center font-display font-semibold text-[20px]">{state.user.name[0]}</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[18px]">{state.user.name}</div>
          <div className="text-[13px] text-mute num">{state.user.phone}</div>
          {goal && <div className="text-[12px] text-mute mt-0.5">Цель: {goal.title}</div>}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => nav.open('portfolio')} className="bz-card text-left py-3.5 min-w-0">
          <PieChart size={18} />
          <div className="text-[12px] text-mute mt-2">Весь портфель</div>
          <div className="font-display font-semibold text-[15px] num mt-0.5 truncate">{money(totals.all)}</div>
        </button>
        <button onClick={() => nav.open('history')} className="bz-card text-left py-3.5">
          <History size={18} />
          <div className="text-[12px] text-mute mt-2">История операций</div>
          <div className="font-display font-semibold text-[15px] num mt-0.5">{state.txs.length}</div>
        </button>
      </div>

      <Section title="Карта">
        <Card className="py-0">
          <Item icon={CreditCard} title="Карта и реквизиты" sub={`VISA •••• ${s.cardLast4}`} onClick={() => nav.open('cardPage')} />
          <Item icon={Snowflake} title={s.frozen ? 'Карта заморожена' : 'Заморозить карту'} sub={s.frozen ? 'Оплаты отклоняются. Нажмите, чтобы разморозить' : 'Временно запретить оплаты или перевыпустить'}
            tone={s.frozen ? 'bg-down/12 text-down' : undefined} onClick={() => nav.open('freeze')} />
          <Item icon={Globe} title="Оплата в интернете" sub={!s.online ? 'Выключена' : `Включена${s.subs ? ', подписки' : ''}${s.foreign ? ', зарубежные сайты' : ''}`} onClick={() => nav.open('online')} />
          <Item icon={Gauge} title="Лимиты" sub={`Покупки ${kzt(s.dailyLimit)} · онлайн ${kzt(s.onlineLimit)} в день`} onClick={() => nav.open('limits')} />
        </Card>
      </Section>

      <Section title="Приложение">
        <Card className="py-0">
          <Item icon={Bot} title="Помощник" sub="Объясняет комиссии, отказы, кешбэк и расходы" onClick={() => nav.open('assistant')} />
          <Item icon={ShieldCheck} title="Безопасность" sub={`${s.biometrics ? 'Face ID' : 'Код'} · устройства · история входов`} onClick={() => nav.open('security')} />
          <Item icon={Bell} title="Push-уведомления" sub="Баннеры об оплатах, кешбэке и операциях"
            right={<Switch aria-label="Push-уведомления" checked={s.push} onCheckedChange={set('push')} />} />
          <Item icon={Coins} title="Валюта отображения" sub="Портфель и балансы пересчитываются для просмотра. Счета остаются в тенге"
            below={<SegmentedControl className="bz-seg-3" aria-label="Валюта отображения" items={CURRENCIES} value={s.currency} onValueChange={set('currency')} />} />
          <Item icon={Palette} title="Тема оформления"
            below={<SegmentedControl className="bz-seg-3" aria-label="Тема оформления" items={THEMES} value={s.theme} onValueChange={set('theme')} />} />
        </Card>
      </Section>

      <Section title="Биржа и активы">
        <Card className="py-0">
          <Item icon={Sparkles} title="Кешбэк 1%" sub={`Получаю: ${CB_LABEL[state.cashback]}`} tone="bg-gold-soft text-gold" onClick={() => nav.open('cashback')} />
          <Item icon={Link2} title="Биржи-партнёры" sub={connected ? `Подключено: ${connected}` : 'Не подключены'} onClick={() => nav.tab('partners')} />
          <Item icon={Repeat} title="Автоконвертация USDT" sub="Если на карте не хватает ₸, докупить из USDT на подключённой бирже"
            right={<Switch aria-label="Автоконвертация USDT" checked={s.autoConvert} onCheckedChange={set('autoConvert')} />} />
          <Item icon={LineChart} title="Уведомления о цене" sub="Изменение цены золота за день, без рекомендаций"
            right={<Switch aria-label="Уведомления о цене" checked={s.priceAlerts} onCheckedChange={set('priceAlerts')} />} />
          <Item icon={ShieldAlert} title="Профиль риска" sub="При низком предупредим перед покупкой крипты"
            below={<SegmentedControl className="bz-seg-3" aria-label="Профиль риска" items={RISKS} value={s.risk} onValueChange={set('risk')} />} />
          <Item icon={Timer} title="Фиксация котировки" sub="Цена держится 30 секунд, затем её нужно обновить" />
        </Card>
      </Section>

      <Section title="Документы">
        <Card className="py-0">
          <Item icon={FileText} title="Документы и условия" sub="Тарифы, условия, выписки и справки" onClick={() => nav.open('documents')} />
          <Item icon={Landmark} title="Налоги" sub="Доход от продажи активов, справка для декларации" onClick={() => nav.open('taxes')} />
        </Card>
      </Section>

      {confirmReset ? (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-center">Сбросить все тестовые данные и начать с онбординга?</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>Отмена</Button>
            <Button variant="danger" onClick={() => dispatch({ type: 'reset' })}>Сбросить</Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" onClick={() => setConfirmReset(true)}><RotateCcw size={16} /> Сбросить демо</Button>
      )}
      <button onClick={tapVersion} className="text-[11px] text-mute text-center select-none">Bozzihyra 0.4 · демо-версия · данные тестовые</button>
    </div>
  )
}
