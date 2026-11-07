import { useMemo, useState } from 'react'
import { SegmentedControl } from 'glisse'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { ShieldCheck, ChevronDown, Info, TrendingDown, TrendingUp } from 'lucide-react'
import { useStore } from '../store.jsx'
import { GOLD_HISTORY, CUSTODY, FEES } from '../lib/mock.js'
import { kzt, grams, pct, dateShort } from '../lib/format.js'
import { Button, Card, Label, Row, Disclaimer } from '../components/ui.jsx'

const RANGES = [
  { value: '7d', label: '7Д', days: 7, long: 'неделю' },
  { value: '30d', label: '1М', days: 30, long: 'месяц' },
  { value: '90d', label: '3М', days: 90, long: '3 месяца' },
  { value: '1y', label: '1Г', days: 365, long: 'год' },
]

export default function Gold({ nav }) {
  const { state, goldPrice } = useStore()
  const [range, setRange] = useState('30d')
  const [custodyOpen, setCustodyOpen] = useState(false)
  const r = RANGES.find((x) => x.value === range)

  const data = useMemo(() => {
    const slice = GOLD_HISTORY.slice(-r.days)
    return [...slice.slice(0, -1), { ...slice[slice.length - 1], price: goldPrice }]
  }, [r, goldPrice])

  const change = goldPrice / data[0].price - 1
  const up = change >= 0
  const prices = data.map((d) => d.price)
  const min = Math.min(...prices), max = Math.max(...prices)
  const pad = (max - min) * 0.15 || 100

  const g = state.balances.gold
  const buys = state.txs.filter((t) => t.kind === 'buy')
  const boughtG = buys.reduce((s, t) => s + t.grams, 0)
  const avgBuy = boughtG > 0 ? buys.reduce((s, t) => s - t.kzt, 0) / boughtG : null

  return (
    <div className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-6 flex flex-col gap-4">
      <header className="px-1">
        <div className="flex items-center gap-2.5">
          <span className="bz-coin w-9 h-9 rounded-full" />
          <div>
            <div className="font-semibold text-[16px] leading-tight">Золото bzGOLD</div>
            <div className="text-[12px] text-mute">1 токен = 1 г золота 999,9</div>
          </div>
        </div>
        <div className="mt-4 font-display font-semibold text-[30px] num leading-tight">{kzt(goldPrice)}</div>
        <div className={`flex flex-wrap items-center gap-x-1.5 text-[14px] font-medium num ${up ? 'text-up' : 'text-down'}`}>
          {up ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {pct(change)} за {r.long}
          <span className="text-mute font-normal">· тестовая котировка за 1 г</span>
        </div>
      </header>

      <Card className="px-2 pt-3 pb-3">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d9aa45" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#d9aa45" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(128,128,128,.22)" strokeDasharray="3 4" />
              <XAxis dataKey="t" tickFormatter={dateShort} tick={{ fontSize: 10, fill: '#8b9189' }} axisLine={false} tickLine={false} minTickGap={40} />
              <YAxis domain={[min - pad, max + pad]} hide />
              <Tooltip
                formatter={(v) => [kzt(v), '1 г']}
                labelFormatter={(l) => new Date(l).toLocaleDateString('ru-RU')}
                contentStyle={{ borderRadius: 14, border: '1px solid var(--line)', background: 'var(--card)', backdropFilter: 'blur(12px)', color: 'var(--fg)', fontSize: 12 }} />
              <Area type="monotone" dataKey="price" stroke="#c9972f" strokeWidth={2} fill="url(#goldFill)"
                isAnimationActive={false} activeDot={{ r: 4, fill: '#d9aa45', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center mt-2">
          <SegmentedControl className="bz-seg" aria-label="Период графика" items={RANGES} value={range} onValueChange={setRange} />
        </div>
      </Card>

      <Card>
        <Label>У вас</Label>
        <div className="flex items-baseline justify-between mt-1">
          <span className="font-display font-semibold text-[22px] num">{grams(g)}</span>
          <span className="num text-[15px]">≈ {kzt(g * goldPrice)}</span>
        </div>
        {avgBuy && <div className="text-[12px] text-mute mt-1 num">Средняя цена покупки: {kzt(avgBuy)} за 1 г</div>}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button onClick={() => nav.open('trade', { mode: 'buy' })}>Купить</Button>
          <Button variant="ghost" disabled={g < FEES.minSellGrams} onClick={() => nav.open('trade', { mode: 'sell' })}>Продать</Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <button onClick={() => setCustodyOpen(!custodyOpen)} aria-expanded={custodyOpen}
          className="w-full flex items-center gap-3 p-4 text-left">
          <span className="w-10 h-10 rounded-full bg-up/12 text-up grid place-items-center"><ShieldCheck size={20} /></span>
          <div className="flex-1">
            <div className="font-semibold text-[15px]">Где хранится золото</div>
            <div className="text-[12px] text-mute">Обеспечение 1:1 · аудит {CUSTODY.lastAudit}</div>
          </div>
          <ChevronDown size={18} className={`transition ${custodyOpen ? 'rotate-180' : ''}`} />
        </button>
        {custodyOpen && (
          <div className="px-4 pb-4 divide-y divide-line">
            <Row label="Хранение" value="Физический слиток" muted />
            <Row label="Кастодиан" value={CUSTODY.custodian} muted />
            <Row label="Обеспечение" value={CUSTODY.backing} muted />
            <Row label="Последний аудит" value={`${CUSTODY.lastAudit}, ${CUSTODY.auditor}`} muted />
            <Row label="Всего выпущено" value={CUSTODY.totalIssued} muted />
            <p className="text-[12px] text-mute pt-3">Каждый токен привязан к конкретному весу золота в хранилище. Отчёт аудитора публикуется ежемесячно.</p>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Info size={16} className="text-gold" />
          <span className="font-semibold text-[15px]">Как работает кешбэк в золоте</span>
        </div>
        <ol className="flex flex-col gap-2.5 text-[14px] leading-snug">
          <li className="flex gap-3"><Step n={1} />Вы платите картой 10 000 ₸.</li>
          <li className="flex gap-3"><Step n={2} />1% = 100 ₸ переводим в золото по текущей цене: 100 ₸ / {kzt(goldPrice)} ≈ {grams(100 / goldPrice)}.</li>
          <li className="flex gap-3"><Step n={3} />Граммы остаются вашими. Их стоимость в тенге меняется вместе с ценой золота, вверх и вниз.</li>
        </ol>
      </Card>

      <Disclaimer>
        bzGOLD не является банковским депозитом и не входит в систему гарантирования вкладов. Стоимость золота может снижаться; прошлая динамика не гарантирует будущий результат. Котировки тестовые.
      </Disclaimer>
    </div>
  )
}

function Step({ n }) {
  return <span className="shrink-0 w-6 h-6 rounded-full bg-gold-soft text-gold text-[12px] font-semibold grid place-items-center">{n}</span>
}
