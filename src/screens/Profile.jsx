import { useState } from 'react'
import { BarChart3, RotateCcw, ShieldCheck, FileText } from 'lucide-react'
import { useStore } from '../store.jsx'
import { GOALS } from '../lib/mock.js'
import { Card, Label, Button, Row } from '../components/ui.jsx'

export default function Profile({ nav }) {
  const { state, dispatch } = useStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const e = state.events
  const goal = GOALS.find((g) => g.id === state.goal)
  const firstBuy = (e.gold_buy || 0) > 0
  const cashbackChosen = state.cashback === 'gold' ? 'Золото' : state.cashback === 'btc' ? 'BTC' : 'Тенге'

  const funnel = [
    { label: 'Открыл приложение', done: (e.app_open || 0) > 0 },
    { label: 'Прошёл онбординг', done: (e.onboarding_done || 0) > 0 },
    { label: 'Пополнил баланс', done: (e.topup || 0) > 0 },
    { label: 'Первая покупка золота', done: firstBuy },
    { label: 'Оплатил картой, получил кешбэк', done: (e.card_payment || 0) > 0 },
    { label: 'Подключил биржу', done: (e.partner_connected || 0) > 0 },
  ]
  const doneCount = funnel.filter((f) => f.done).length

  return (
    <div className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-6 flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <span className="w-14 h-14 rounded-full bg-vault text-white grid place-items-center font-display font-semibold text-[20px]">{state.user.name[0]}</span>
        <div>
          <div className="font-semibold text-[18px]">{state.user.name}</div>
          <div className="text-[13px] text-mute num">{state.user.phone}</div>
        </div>
      </header>

      <Card className="py-1 divide-y divide-line">
        <Row label="Цель" value={goal?.title || '—'} />
        <Row label="Сегмент" value={goal?.segment || '—'} muted />
        <Row label="Кешбэк" value={<button className="underline" onClick={() => nav.open('cashback')}>{cashbackChosen}</button>} />
        <Row label="Верификация" value={<span className="text-up flex items-center gap-1 justify-end"><ShieldCheck size={14} /> Пройдена (тест)</span>} />
      </Card>

      <section>
        <div className="flex items-center gap-2 mb-2 px-1">
          <BarChart3 size={16} />
          <h3 className="font-semibold text-[16px]">Метрики гипотезы</h3>
          <span className="ml-auto text-[12px] text-mute">для защиты</span>
        </div>
        <Card>
          <Label>Путь клиента · {doneCount} из {funnel.length}</Label>
          <ol className="mt-3 flex flex-col gap-2">
            {funnel.map((f, i) => (
              <li key={f.label} className="flex items-center gap-3 text-[14px]">
                <span className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-semibold num ${f.done ? 'bg-up text-white' : 'bg-ink/6 text-mute'}`}>{i + 1}</span>
                <span className={f.done ? '' : 'text-mute'}>{f.label}</span>
              </li>
            ))}
          </ol>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Metric label="Возвраты (сессии)" value={e.app_open || 0} />
            <Metric label="Покупки золота" value={e.gold_buy || 0} />
            <Metric label="Оплаты картой" value={e.card_payment || 0} />
            <Metric label="Котировка истекла" value={e.quote_expired || 0} />
            <Metric label="Выбор кешбэка" value={cashbackChosen} />
            <Metric label="Ошибки" value={(e.error_insufficient || 0) + (e.error_partner_not_allowed || 0) + (e.error_otp || 0)} />
          </div>
        </Card>
      </section>

      <Card className="flex gap-3 items-start">
        <FileText size={18} className="shrink-0 mt-0.5 text-mute" />
        <p className="text-[12px] text-mute leading-snug">
          Прототип для хакатона BCC Future Talent. Все данные, котировки и комиссии тестовые. bzGOLD не является депозитом; стоимость золота может снижаться. Регуляторная модель — гипотеза.
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
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl bg-ink/5 p-3">
      <div className="text-[11px] text-mute">{label}</div>
      <div className="font-display font-semibold text-[18px] num mt-0.5">{value}</div>
    </div>
  )
}
