import { useRef, useState } from 'react'
import { Switch, Slider, SegmentedControl } from 'glisse'
import { PieChart, History, ChevronRight, Snowflake, Globe, Bell, ScanFace, Palette, Gauge, Sparkles, Repeat, LineChart, ShieldAlert, Link2, Timer, RotateCcw, FileText } from 'lucide-react'
import { useStore } from '../store.jsx'
import { GOALS, PARTNERS } from '../lib/mock.js'
import { kzt } from '../lib/format.js'
import { Card, Button, Section } from '../components/ui.jsx'

const CB_LABEL = { gold: 'Золото', btc: 'BTC', kzt: 'Тенге' }
const THEMES = [{ value: 'system', label: 'Авто' }, { value: 'light', label: 'Светлая' }, { value: 'dark', label: 'Тёмная' }]
const RISKS = [{ value: 'conservative', label: 'Низкий' }, { value: 'moderate', label: 'Средний' }, { value: 'active', label: 'Высокий' }]

// Строка настройки: иконка, название, подпись и элемент управления справа или под строкой
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
  const { state, dispatch, totals } = useStore()
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
          {goal && <div className="text-[12px] text-gold mt-0.5">Цель: {goal.title}</div>}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => nav.open('portfolio')} className="bz-card text-left py-3.5">
          <PieChart size={18} className="text-gold" />
          <div className="text-[12px] text-mute mt-2">Весь портфель</div>
          <div className="font-display font-semibold text-[16px] num mt-0.5 truncate">{kzt(totals.all)}</div>
        </button>
        <button onClick={() => nav.open('history')} className="bz-card text-left py-3.5">
          <History size={18} className="text-gold" />
          <div className="text-[12px] text-mute mt-2">История операций</div>
          <div className="font-display font-semibold text-[16px] num mt-0.5">{state.txs.length}</div>
        </button>
      </div>

      <Section title="Банк и карта">
        <Card className="py-0">
          <Item icon={Snowflake} title="Заморозить карту" sub={s.frozen ? 'Оплаты картой отклоняются' : 'Временно запретить все оплаты'}
            tone={s.frozen ? 'bg-down/12 text-down' : undefined}
            right={<Switch aria-label="Заморозить карту" checked={s.frozen} onCheckedChange={set('frozen')} />} />
          <Item icon={Globe} title="Оплата в интернете" sub="Покупки на сайтах и в приложениях"
            right={<Switch aria-label="Оплата в интернете" checked={s.online} onCheckedChange={set('online')} />} />
          <Item icon={Gauge} title="Лимит покупок в день" sub={kzt(s.dailyLimit)}
            below={<Slider aria-label="Лимит покупок в день" min={50000} max={1000000} step={50000} value={s.dailyLimit} onValueChange={set('dailyLimit')} />} />
          <Item icon={Bell} title="Push-уведомления" sub="Баннеры об оплатах, кешбэке и операциях"
            right={<Switch aria-label="Push-уведомления" checked={s.push} onCheckedChange={set('push')} />} />
          <Item icon={ScanFace} title="Вход по Face ID" sub="Вместо кода при открытии приложения"
            right={<Switch aria-label="Вход по Face ID" checked={s.biometrics} onCheckedChange={set('biometrics')} />} />
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

      <Card className="flex gap-3 items-start">
        <FileText size={18} className="shrink-0 mt-0.5 text-mute" />
        <p className="text-[12px] text-mute leading-snug">
          Прототип для хакатона BCC Future Talent. Все данные, котировки и комиссии тестовые. bzGOLD, токенизированные акции и криптовалюты не являются депозитом; их стоимость может снижаться. Регуляторная модель — гипотеза.
        </p>
      </Card>

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
      <button onClick={tapVersion} className="text-[11px] text-mute text-center select-none">Bozzihyra 0.3 · демо-версия</button>
    </div>
  )
}
