import { useState } from 'react'
import { SegmentedControl } from 'glisse'
import { ShieldCheck, ChevronRight, TrendingDown, TrendingUp, Info, Receipt } from 'lucide-react'
import { useStore } from '../store.jsx'
import { ASSETS, CUSTODY, FEES } from '../lib/mock.js'
import { kzt, grams, pct } from '../lib/format.js'
import { Button, Card, Label, Row, Disclaimer, Section } from '../components/ui.jsx'
import PriceChart, { useSeries } from '../components/PriceChart.jsx'

const VIEWS = [
  { value: 'price', label: 'Цена' },
  { value: 'about', label: 'О токене' },
]

export default function Gold({ nav }) {
  const [view, setView] = useState('price')
  return (
    <div className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-6 flex flex-col gap-4">
      <header className="flex items-center gap-2.5 px-1">
        <span className="bz-coin w-9 h-9 rounded-full" />
        <div className="flex-1">
          <div className="font-semibold text-[16px] leading-tight">Золото bzGOLD</div>
          <div className="text-[12px] text-mute">1 токен = 1 г золота 999,9</div>
        </div>
      </header>
      <div className="flex justify-center">
        <SegmentedControl className="bz-seg-half" aria-label="Раздел" items={VIEWS} value={view} onValueChange={setView} />
      </div>
      <div key={view} className="flex flex-col gap-4 anim-rise">
        {view === 'price' ? <PriceView nav={nav} onAbout={() => setView('about')} /> : <AboutView />}
      </div>
    </div>
  )
}

function PriceView({ nav, onAbout }) {
  const { state, goldPrice } = useStore()
  const [range, setRange] = useState('30d')
  const { data, change, range: r } = useSeries('gold', range, goldPrice)
  const up = change >= 0
  const g = state.balances.gold
  const buys = state.txs.filter((t) => t.asset === 'gold' && t.kind === 'buy')
  const boughtG = buys.reduce((s, t) => s + t.qty, 0)
  const avgBuy = boughtG > 0 ? buys.reduce((s, t) => s - t.kzt, 0) / boughtG : null

  return (
    <>
      <div className="px-1">
        <div className="font-display font-semibold text-[30px] num leading-tight">{kzt(goldPrice)}</div>
        <div className={`flex flex-wrap items-center gap-x-1.5 text-[14px] font-medium num ${up ? 'text-up' : 'text-down'}`}>
          {up ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {pct(change)} за {r.long}
          <span className="text-mute font-normal">· тестовая котировка за 1 г</span>
        </div>
      </div>

      <PriceChart data={data} color="#d9aa45" unit="1 г" range={range} onRange={setRange} />

      {/* Прозрачность хранения остаётся на виду одной строкой */}
      <button onClick={onAbout} className="bz-card flex items-center gap-3 text-left py-3">
        <span className="w-9 h-9 rounded-full bg-up/12 text-up grid place-items-center"><ShieldCheck size={18} /></span>
        <span className="flex-1 text-[14px]">Обеспечено 1:1 · аудит {CUSTODY.lastAudit}</span>
        <ChevronRight size={18} className="text-mute" />
      </button>

      <Card>
        <Label>У вас</Label>
        <div className="flex items-baseline justify-between mt-1">
          <span className="font-display font-semibold text-[22px] num">{grams(g)}</span>
          <span className="num text-[15px]">≈ {kzt(g * goldPrice)}</span>
        </div>
        {avgBuy && <div className="text-[12px] text-mute mt-1 num">Средняя цена покупки: {kzt(avgBuy)} за 1 г</div>}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button onClick={() => nav.open('trade', { asset: 'gold', mode: 'buy' })}>Купить</Button>
          <Button variant="ghost" disabled={g * goldPrice < FEES.minSellKzt} onClick={() => nav.open('trade', { asset: 'gold', mode: 'sell' })}>Продать</Button>
        </div>
      </Card>

      <Disclaimer>
        bzGOLD не является банковским депозитом. Стоимость золота может снижаться; прошлая динамика не гарантирует будущий результат.
      </Disclaimer>
    </>
  )
}

function AboutView() {
  const { goldPrice } = useStore()
  const gold = ASSETS.gold
  return (
    <>
      <Section title="Где хранится золото">
        <Card className="py-1 divide-y divide-line">
          <Row label="Хранение" value="Физический слиток" muted />
          <Row label="Кастодиан" value={CUSTODY.custodian} muted />
          <Row label="Обеспечение" value={CUSTODY.backing} muted />
          <Row label="Последний аудит" value={`${CUSTODY.lastAudit}, ${CUSTODY.auditor}`} muted />
          <Row label="Всего выпущено" value={CUSTODY.totalIssued} muted />
        </Card>
        <p className="text-[12px] text-mute px-1">Каждый токен привязан к конкретному весу золота в хранилище. Отчёт аудитора публикуется ежемесячно.</p>
      </Section>

      <Section title="Как работает кешбэк в золоте">
        <Card>
          <ol className="flex flex-col gap-3 text-[14px] leading-snug">
            <li className="flex gap-3"><Step n={1} />Вы платите картой 10 000 ₸.</li>
            <li className="flex gap-3"><Step n={2} />1% = 100 ₸ переводим в золото по текущей цене: 100 ₸ / {kzt(goldPrice)} ≈ {grams(100 / goldPrice)}.</li>
            <li className="flex gap-3"><Step n={3} />Граммы остаются вашими. Их стоимость в тенге меняется вместе с ценой золота, вверх и вниз.</li>
            <li className="flex gap-3"><Step n={4} />Граммы можно продать в любой момент и получить тенге на карту.</li>
          </ol>
        </Card>
      </Section>

      <Section title="Цены и комиссии">
        <Card className="py-1 divide-y divide-line">
          <Row label="Спред при покупке и продаже" value={`${(gold.spread * 100).toFixed(1)}%`} muted />
          <Row label="Комиссия сервиса" value={`${(FEES.commission * 100).toFixed(1)}%, мин. ${kzt(FEES.minCommission)}`} muted />
          <Row label="Минимальная покупка" value={kzt(FEES.minBuy)} muted />
          <Row label="Котировка фиксируется" value={`на ${FEES.quoteTtl} сек`} muted />
          <Row label="Хранение" value="Бесплатно" muted />
        </Card>
      </Section>

      <Card className="flex gap-3">
        <Info size={18} className="text-gold shrink-0 mt-0.5" />
        <p className="text-[13px] leading-snug">
          bzGOLD не депозит и не входит в систему гарантирования вкладов. Стоимость может снижаться. Прошлая динамика не гарантирует будущий результат. Котировки тестовые.
        </p>
      </Card>
      <p className="text-[12px] text-mute flex items-center gap-1.5 px-1"><Receipt size={14} /> Регуляторная модель — гипотеза для отдельной проверки.</p>
    </>
  )
}

function Step({ n }) {
  return <span className="shrink-0 w-6 h-6 rounded-full bg-gold-soft text-gold text-[12px] font-semibold grid place-items-center">{n}</span>
}
