import { Button as GButton } from 'glisse'
import { Plus, Coins, CreditCard, Link2, Bell, ChevronRight, ArrowDownLeft, ArrowUpRight, Sparkles, Repeat } from 'lucide-react'
import { useStore } from '../store.jsx'
import { kzt, grams, time, btc } from '../lib/format.js'
import { Card, Label, Notice } from '../components/ui.jsx'
import { Wordmark } from './Onboarding.jsx'

const HINTS = {
  save: 'Платите картой: 1% каждой покупки придёт в миллиграммах золота.',
  diversify: 'Начните с небольшой покупки золота. Котировка и комиссия видны до подтверждения.',
  crypto: 'Подключите биржу из реестра МФЦА и тратьте USDT картой, как тенге.',
}

export default function Home({ nav }) {
  const { state, totals, goldPrice } = useStore()
  const g = state.balances.gold
  const nextGram = Math.max(1, Math.ceil(g + 1e-9))
  const progress = Math.min(1, g / nextGram)
  const cashbackGrams = state.txs.filter((t) => t.kind === 'cashback' && t.grams).reduce((s, t) => s + t.grams, 0)

  const parts = [
    { id: 'kzt', label: 'Тенге', value: totals.kzt, color: 'var(--fg)' },
    { id: 'gold', label: 'Золото', value: totals.gold, color: 'var(--gold-fill)' },
    { id: 'btc', label: 'BTC', value: totals.btc, color: '#5d7e9e' },
    { id: 'partners', label: 'На биржах', value: totals.partners, color: 'var(--mute)' },
  ].filter((p) => p.value > 0)

  const actions = [
    { label: 'Пополнить', icon: <Plus />, onClick: () => nav.open('topup') },
    { label: 'Купить золото', icon: <Coins />, onClick: () => nav.open('trade', { mode: 'buy' }), gold: true },
    { label: 'Оплатить', icon: <CreditCard />, onClick: () => nav.tab('card') },
    { label: 'Биржи', icon: <Link2 />, onClick: () => nav.tab('partners') },
  ]

  return (
    <div className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-6 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <Wordmark />
          <div className="text-[13px] text-mute mt-0.5">Добрый день, {state.user.name}</div>
        </div>
        <span className="relative">
          <GButton icon={<Bell />} aria-label="Уведомления" />
          {state.txs.length > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-gold-fill pointer-events-none" />}
        </span>
      </header>

      {/* Общий портфель */}
      <Card aria-label="Общий портфель">
        <Label>Весь портфель</Label>
        <div className="font-display font-semibold text-[30px] leading-tight num mt-1">{kzt(totals.all)}</div>
        {parts.length > 0 ? (
          <>
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mt-3">
              {parts.map((p) => <span key={p.id} style={{ flexGrow: p.value, background: p.color }} />)}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
              {parts.map((p) => (
                <span key={p.id} className="flex items-center gap-1.5 text-[12px] text-mute">
                  <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  {p.label} <span className="num text-ink">{kzt(p.value)}</span>
                </span>
              ))}
            </div>
            {totals.partners > 0 && (
              <p className="text-[11px] text-mute mt-1.5">«На биржах» хранится у партнёров и показано для удобства.</p>
            )}
          </>
        ) : (
          <p className="text-[13px] text-mute mt-1">Пока пусто. Пополните тестовый баланс, чтобы начать.</p>
        )}
      </Card>

      {/* Копилка граммов */}
      <button onClick={() => nav.tab('gold')} className="text-left rounded-[28px] bg-vault text-white p-5 relative overflow-hidden isolate">
        <div className="bz-coin absolute -right-12 -top-12 w-48 h-48 rounded-full -z-10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-vault via-vault/80 to-transparent" />
        <div className="text-[11px] uppercase tracking-[.08em] text-white/60">Ваше золото · bzGOLD</div>
        <div className="font-display font-semibold text-[34px] leading-tight mt-1 num">{grams(g)}</div>
        <div className="text-[13px] text-white/65 num">≈ {kzt(totals.gold)} по текущей котировке</div>

        <div className="mt-5">
          <div className="flex justify-between text-[12px] text-white/75 mb-1.5">
            <span>До {nextGram} г</span>
            <span className="num">{grams(Math.max(0, nextGram - g))} осталось</span>
          </div>
          <div className="h-2 rounded-full bg-white/12 overflow-hidden">
            <div className="h-full rounded-full bg-gold-fill transition-all duration-700" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-[13px]">
          <span className="flex items-center gap-1.5 text-gold-2">
            <Sparkles size={14} /> Кешбэк накопил {grams(cashbackGrams)}
          </span>
          <ChevronRight size={18} className="text-white/50" />
        </div>
      </button>

      <div className="grid grid-cols-4 gap-2">
        {actions.map(({ label, icon, onClick, gold }) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <GButton icon={icon} aria-label={label} onClick={onClick} variant={gold ? 'filled' : 'glass'}
              style={{ width: 56, height: 56, borderRadius: 20 }} />
            <span className="text-[12px] text-center leading-tight">{label}</span>
          </div>
        ))}
      </div>

      {state.goal && state.txs.length < 3 && (
        <Notice icon={<Sparkles size={18} className="text-gold" />} title="С чего начать">{HINTS[state.goal]}</Notice>
      )}

      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="font-semibold text-[16px]">Операции</h3>
          <span className="text-[12px] text-mute num">1 г = {kzt(goldPrice)}</span>
        </div>
        {state.txs.length === 0 ? (
          <Card className="text-center text-[14px] text-mute py-8">Здесь появятся пополнения, покупки и кешбэк</Card>
        ) : (
          <Card className="py-1">
            {state.txs.slice(0, 6).map((t) => <TxRow key={t.id} t={t} />)}
          </Card>
        )}
      </section>
    </div>
  )
}

export function TxRow({ t }) {
  const icon = {
    topup: <ArrowDownLeft size={16} />,
    buy: <Coins size={16} />,
    sell: <Coins size={16} />,
    pay: <ArrowUpRight size={16} />,
    cashback: <Sparkles size={16} />,
    transfer: <Repeat size={16} />,
  }[t.kind]
  const gold = t.kind === 'cashback' || t.kind === 'buy' || t.kind === 'sell'
  let value = t.kzt != null ? kzt(t.kzt) : ''
  if (t.kzt > 0) value = '+' + value
  let sub = t.sub || time(t.ts)
  if (t.kind === 'cashback') {
    value = t.grams ? `+${grams(t.grams)}` : t.btc ? `+${btc(t.btc)}` : `+${kzt(t.kztBack, 2)}`
    sub = `1% = ${kzt(t.cashbackKzt, 2)} · ${time(t.ts)}`
  }
  if (t.kind === 'buy' || t.kind === 'sell') sub = `${t.grams > 0 ? '+' : ''}${grams(t.grams)} · ${time(t.ts)}`
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
      <span className={`w-9 h-9 rounded-full grid place-items-center ${gold ? 'bg-gold-soft text-gold' : 'bg-ink/6'}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium truncate">{t.title}</div>
        <div className="text-[12px] text-mute truncate">{sub}</div>
      </div>
      <div className={`num text-[14px] font-medium ${t.kind === 'cashback' ? 'text-gold' : (t.kzt > 0 ? 'text-up' : '')}`}>{value}</div>
    </div>
  )
}

