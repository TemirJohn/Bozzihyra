import { useState } from 'react'
import { SegmentedControl, Slider, Button as GButton } from 'glisse'
import { ShieldCheck, TrendingUp, TrendingDown, Sparkles, UserPlus } from 'lucide-react'
import { useStore } from '../store.jsx'
import { ASSETS, STOCKS, CRYPTO, CUSTODY, FEES, dayChange } from '../lib/mock.js'
import { kzt, pct, grams } from '../lib/format.js'
import { Card, Button, Row, Section, Label, Disclaimer } from '../components/ui.jsx'
import PriceChart, { useSeries } from '../components/PriceChart.jsx'
import { AssetIcon } from './AssetPanel.jsx'
import { Wordmark } from './Onboarding.jsx'
import GoldBar from '../components/GoldBar.jsx'
import ToonGold from '../components/ToonGold.jsx'

const VIEWS = [{ value: 'gold', label: 'Золото' }, { value: 'stock', label: 'Акции' }, { value: 'crypto', label: 'Крипта' }]

// Рынок без аккаунта: смотреть можно всё, покупать — после открытия счёта
export default function Guest({ nav }) {
  const [view, setView] = useState('gold')
  return (
    <div className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-8 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <Wordmark />
          <div className="text-[12px] text-mute mt-0.5">Гостевой режим · котировки тестовые</div>
        </div>
        <GButton className="bz-sm" onClick={nav.signup}>Войти</GButton>
      </header>

      <div className="rounded-[24px] bg-vault text-white p-5 relative overflow-hidden isolate">
        <div className="absolute -right-6 -top-2 -z-10"><ToonGold model="nugget" size={160} sparkle label="Золотой самородок" /></div>
        <div className="font-display font-semibold text-[19px] leading-snug max-w-[16ch]">Кешбэк 1% в граммах золота</div>
        <p className="text-[13px] text-white/70 mt-1.5 max-w-[30ch]">Откройте счёт за 2 минуты: нужен только номер телефона.</p>
        <button onClick={nav.signup} className="mt-4 h-10 px-4 rounded-full bg-white text-black text-[14px] font-semibold flex items-center gap-2">
          <UserPlus size={16} /> Открыть счёт
        </button>
      </div>

      <div className="flex justify-center">
        <SegmentedControl className="bz-seg-3g" aria-label="Рынок" items={VIEWS} value={view} onValueChange={setView} />
      </div>

      <div key={view} className="flex flex-col gap-4 anim-rise">
        {view === 'gold' ? <GoldView nav={nav} /> : <ListView nav={nav} ids={view === 'stock' ? STOCKS : CRYPTO} />}
      </div>
    </div>
  )
}

function GoldView({ nav }) {
  const { goldPrice } = useStore()
  const [range, setRange] = useState('30d')
  const [spend, setSpend] = useState(200000)
  const { data, change, range: r } = useSeries('gold', range, goldPrice)
  const monthG = (spend * FEES.cashbackRate) / goldPrice
  return (
    <>
      <div className="px-1">
        <Label>Золото bzGOLD · 1 г</Label>
        <div className="font-display font-semibold text-[30px] num leading-tight mt-1">{kzt(goldPrice)}</div>
        <div className={`flex items-center gap-1.5 text-[14px] font-medium num ${change >= 0 ? 'text-up' : 'text-down'}`}>
          {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}{pct(change)} за {r.long}
        </div>
      </div>
      <PriceChart data={data} color="#d9aa45" unit="1 г" range={range} onRange={setRange} />

      <Section title="Сколько золота даст кешбэк">
        <Card>
          <div className="flex items-baseline justify-between gap-3">
            <span id="spend-l" className="text-[14px]">Трачу картой в месяц</span>
            <span className="font-display font-semibold text-[16px] num">{kzt(spend)}</span>
          </div>
          <div className="mt-3"><Slider aria-labelledby="spend-l" min={50000} max={1000000} step={10000} value={spend} onValueChange={setSpend} /></div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="rounded-2xl bg-gold-soft p-3">
              <div className="text-[11px] text-mute">В месяц</div>
              <div className="font-display font-semibold text-[17px] num text-gold">{grams(monthG)}</div>
            </div>
            <div className="rounded-2xl bg-gold-soft p-3">
              <div className="text-[11px] text-mute">За год</div>
              <div className="font-display font-semibold text-[17px] num text-gold">{grams(monthG * 12)}</div>
            </div>
          </div>
          <p className="text-[12px] text-mute mt-3">Считаем по сегодняшней цене золота. Граммы ваши, а их стоимость в тенге будет меняться вместе с ценой, вверх и вниз.</p>
        </Card>
      </Section>

      <Section title="Где хранится">
        <Card className="py-1 divide-y divide-line">
          <Row label="Обеспечение" value="1 г золота 999,9 на токен" muted />
          <Row label="Кастодиан" value={CUSTODY.custodian} muted />
          <Row label="Последний аудит" value={CUSTODY.lastAudit} muted />
          <Row label="Спред и комиссия" value={`${ASSETS.gold.spread * 100}% + ${FEES.commission * 100}%`} muted />
        </Card>
      </Section>

      <Button onClick={() => nav.open('signupPrompt', { what: 'купить золото' })}><Sparkles size={16} /> Купить золото</Button>
      <Disclaimer>bzGOLD не является депозитом. Стоимость может снижаться; прошлая динамика не гарантирует будущий результат.</Disclaimer>
    </>
  )
}

function ListView({ nav, ids }) {
  const { prices } = useStore()
  return (
    <Card className="py-1">
      {ids.map((id) => {
        const a = ASSETS[id]
        const ch = dayChange(id)
        return (
          <button key={id} onClick={() => nav.open('asset', { id })}
            className="w-full flex items-center gap-3 py-3 border-b border-line last:border-0 text-left">
            <AssetIcon asset={a} size={38} />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium">{a.name}</div>
              <div className="text-[12px] text-mute">{a.symbol}</div>
            </div>
            <div className="text-right">
              <div className="text-[14px] num font-medium">{kzt(prices[id])}</div>
              <div className={`text-[12px] num ${ch >= 0 ? 'text-up' : 'text-down'}`}>{pct(ch)} за день</div>
            </div>
          </button>
        )
      })}
    </Card>
  )
}

// Мягкое предложение открыть счёт, когда гость пытается купить
export function SignupPrompt({ what = 'покупать', nav }) {
  return (
    <div className="absolute inset-0 z-40 bg-black/40 flex items-end" onClick={nav.close}>
      <div className="w-full bg-paper rounded-t-[28px] p-6 pb-[max(24px,env(safe-area-inset-bottom))] anim-slide flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <GoldBar live={false} size={84} className="mx-auto -my-3" />
        <div className="text-center">
          <div className="font-display font-semibold text-[20px] text-balance">Откройте счёт, чтобы {what}</div>
          <p className="text-[14px] text-mute mt-2">Это займёт 2 минуты. Нужен только номер телефона. После открытия начнёт копиться кешбэк в золоте.</p>
        </div>
        <div className="flex flex-col gap-2 text-[13px]">
          {['Карта без платы за обслуживание', 'Кешбэк 1% в граммах золота', 'Цена и комиссия видны до покупки'].map((t) => (
            <div key={t} className="flex items-center gap-2"><ShieldCheck size={15} className="text-up" /> {t}</div>
          ))}
        </div>
        <Button onClick={nav.signup}>Открыть счёт</Button>
        <Button variant="ghost" onClick={nav.close}>Продолжить смотреть</Button>
      </div>
    </div>
  )
}
