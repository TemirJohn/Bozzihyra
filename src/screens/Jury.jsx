import { useStore } from '../store.jsx'
import { GOALS } from '../lib/mock.js'
import { Panel, Card, Label } from '../components/ui.jsx'

// Режим жюри: метрики проверки гипотезы. Клиент этот экран не видит.
export default function Jury({ nav }) {
  const { state } = useStore()
  const e = state.events
  const goal = GOALS.find((g) => g.id === state.goal)
  const cashback = state.cashback === 'gold' ? 'Золото' : state.cashback === 'btc' ? 'BTC' : 'Тенге'
  const funnel = [
    { label: 'Открыл приложение', done: (e.app_open || 0) > 0 },
    { label: 'Прошёл онбординг', done: (e.onboarding_done || 0) > 0 },
    { label: 'Пополнил баланс', done: (e.topup || 0) > 0 },
    { label: 'Первая покупка актива', done: (e.any_buy || e.gold_buy || e.asset_buy || 0) > 0 },
    { label: 'Оплатил картой, получил кешбэк', done: (e.card_payment || 0) > 0 },
    { label: 'Подключил биржу', done: (e.partner_connected || 0) > 0 },
  ]
  const errors = Object.entries(e).filter(([k]) => k.startsWith('error_')).reduce((s, [, v]) => s + v, 0)
  const metrics = [
    ['Возвраты (сессии)', e.app_open || 0],
    ['Покупки золота', e.gold_buy || 0],
    ['Покупки акций и крипты', e.asset_buy || 0],
    ['Оплаты картой', e.card_payment || 0],
    ['Выбор кешбэка', cashback],
    ['Котировка истекла', e.quote_expired || 0],
    ['Ошибки', errors],
    ['Вопросы помощнику', e.assistant_question || 0],
    ['Гид', state.tourSeen ? (e.tour_skipped ? 'Пропущен' : 'Пройден') : 'Не показан'],
    ['Гостевые входы', e.guest_open || 0],
    ['Гость → открыл счёт', e.guest_signup || 0],
    ['Сегмент', goal?.segment || '—'],
  ]
  return (
    <Panel title="Режим жюри" onClose={nav.close}>
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-mute px-1">Метрики проверки гипотезы по действиям в этой сессии. Клиент этот экран не видит.</p>
        <Card>
          <Label>Путь клиента · {funnel.filter((f) => f.done).length} из {funnel.length}</Label>
          <ol className="mt-3 flex flex-col gap-2">
            {funnel.map((f, i) => (
              <li key={f.label} className="flex items-center gap-3 text-[14px]">
                <span className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-semibold num ${f.done ? 'bg-up text-white' : 'bg-ink/6 text-mute'}`}>{i + 1}</span>
                <span className={f.done ? '' : 'text-mute'}>{f.label}</span>
              </li>
            ))}
          </ol>
        </Card>
        <div className="grid grid-cols-2 gap-2">
          {metrics.map(([label, value]) => (
            <Card key={label} className="py-3">
              <div className="text-[11px] text-mute">{label}</div>
              <div className="font-display font-semibold text-[17px] num mt-0.5">{value}</div>
            </Card>
          ))}
        </div>
      </div>
    </Panel>
  )
}
