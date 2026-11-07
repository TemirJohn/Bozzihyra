import { useState } from 'react'
import { Button as GButton, SegmentedControl } from 'glisse'
import { CardFace } from './CardControls.jsx'
import { Plus, CreditCard, Link2, Bell, ChevronRight, Sparkles, ArrowDownToLine, ArrowUpFromLine, LineChart, ShieldCheck, Eye, EyeOff, Snowflake } from 'lucide-react'
import { useStore } from '../store.jsx'
import { ASSETS, STOCKS, CRYPTO, PARTNERS, PRICES, CUSTODY, CURRENCIES, dayChange } from '../lib/mock.js'
import { kzt, grams, qty, pct, usdt } from '../lib/format.js'
import { Card, Label, Notice, Row, Section, Empty } from '../components/ui.jsx'
import TxRow from '../components/TxRow.jsx'
import { AssetIcon } from './AssetPanel.jsx'
import { Wordmark } from './Onboarding.jsx'

const TABS = [
  { value: 'card', label: 'Карта' },
  { value: 'gold', label: 'Золото' },
  { value: 'stock', label: 'Акции' },
  { value: 'crypto', label: 'Крипта' },
]
const START_TAB = { save: 'card', diversify: 'gold', crypto: 'crypto' }
const CB_LABEL = { gold: 'в золоте', btc: 'в BTC', kzt: 'в золоте' }

const HINTS = {
  save: 'Платите картой: 1% каждой покупки придёт в миллиграммах золота.',
  diversify: 'Начните с небольшой покупки золота. Котировка и комиссия видны до подтверждения.',
  crypto: 'Подключите биржу из реестра МФЦА и тратьте USDT картой, как тенге.',
}

export default function Home({ nav }) {
  const { state, dispatch, totals, unread, money } = useStore()
  const hidden = state.settings.hideBalances
  const [tab, setTab] = useState(START_TAB[state.goal] || 'card')

  const parts = [
    { id: 'card', value: totals.kzt, color: 'var(--fg)' },
    { id: 'gold', value: totals.gold, color: 'var(--gold-fill)' },
    { id: 'stock', value: totals.stocks, color: 'var(--shade-1)' },
    { id: 'crypto', value: totals.crypto + totals.partners, color: 'var(--shade-2)' },
  ]

  return (
    <div className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-6 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <Wordmark />
          <div className="text-[13px] text-mute mt-0.5">Добрый день, {state.user.name}</div>
        </div>
        <span className="flex items-center gap-2">
          <GButton icon={hidden ? <EyeOff /> : <Eye />} aria-label={hidden ? 'Показать балансы' : 'Скрыть балансы'}
            onClick={() => dispatch({ type: 'setting', key: 'hideBalances', value: !hidden })} />
          <span className="relative">
          <GButton icon={<Bell />} aria-label={`Уведомления${unread ? `, непрочитанных: ${unread}` : ''}`} onClick={() => nav.open('notifications')} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-down text-white text-[11px] font-semibold grid place-items-center num pointer-events-none">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
          </span>
        </span>
      </header>

      {/* Общий итог: бриф требует видеть портфель на главной */}
      <div className="px-1">
        <div className="flex items-center justify-between gap-2">
          <Label>Всего</Label>
          <SegmentedControl className="bz-seg-cur" aria-label="Валюта отображения" items={CURRENCIES} value={state.settings.currency}
            onValueChange={(v) => dispatch({ type: 'setting', key: 'currency', value: v })} />
        </div>
        <button onClick={() => nav.open('portfolio')} className="w-full text-left flex items-center gap-1 mt-0.5" aria-label="Открыть весь портфель">
          <span className="font-display font-semibold text-[30px] leading-tight num">{money(totals.all)}</span>
          <ChevronRight size={20} className="text-mute" />
        </button>
        {state.settings.currency !== 'KZT' && !hidden && <div className="text-[11px] text-mute">Пересчёт для просмотра. Счета в тенге</div>}
        {totals.all > 0 && (
          <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5 mt-2.5">
            {parts.filter((p) => p.value > 0).map((p) => <span key={p.id} style={{ flexGrow: p.value, background: p.color }} />)}
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <SegmentedControl className="bz-seg-full" aria-label="Балансы" items={TABS} value={tab} onValueChange={setTab} />
      </div>

      <div key={tab} className="flex flex-col gap-4 anim-rise">
        {tab === 'card' && <CardTab nav={nav} />}
        {tab === 'gold' && <GoldTab nav={nav} />}
        {tab === 'stock' && <ListTab nav={nav} ids={STOCKS} kind="stock" />}
        {tab === 'crypto' && <ListTab nav={nav} ids={CRYPTO} kind="crypto" />}
      </div>

      {state.goal && state.txs.length < 3 && (
        <Notice icon={<Sparkles size={18} className="text-gold" />} title="С чего начать">{HINTS[state.goal]}</Notice>
      )}
    </div>
  )
}

function Actions({ items }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map(({ label, icon, onClick, primary, disabled }) => (
        <div key={label} className="flex flex-col items-center gap-1.5">
          <GButton icon={icon} aria-label={label} onClick={onClick} disabled={disabled} variant={primary ? 'filled' : 'glass'}
            style={{ width: 54, height: 54, borderRadius: 18 }} />
          <span className="text-[12px] text-center leading-tight">{label}</span>
        </div>
      ))}
    </div>
  )
}

function Ops({ cat, nav, empty }) {
  const { state } = useStore()
  const list = state.txs.filter((t) => t.cat === cat).slice(0, 4)
  return (
    <Section title="Операции" action={
      <button onClick={() => nav.open('history', { filter: cat })} className="text-[13px] font-semibold underline underline-offset-2">Все</button>
    }>
      {list.length ? <Card className="py-1">{list.map((t) => <TxRow key={t.id} t={t} onOpen={(id) => nav.open('receipt', { id })} />)}</Card> : <Empty>{empty}</Empty>}
    </Section>
  )
}

function CardTab({ nav }) {
  const { state } = useStore()
  const s = state.settings
  return (
    <>
      <CardFace onClick={() => nav.open('cardPage')} />
      <div className="flex items-center justify-between text-[12px] text-mute px-1 -mt-2">
        <span className="flex items-center gap-1.5">
          {s.frozen ? <><Snowflake size={13} /> Заморожена</> : <><span className="w-1.5 h-1.5 rounded-full bg-up" /> Активна</>}
        </span>
        <span>Нажмите на карту: реквизиты и управление</span>
      </div>
      <Actions items={[
        { label: 'Пополнить', icon: <Plus />, onClick: () => nav.open('topup'), primary: true },
        { label: 'Оплатить', icon: <CreditCard />, onClick: () => nav.tab('card') },
        { label: 'С биржи', icon: <Link2 />, onClick: () => nav.tab('partners') },
        { label: 'Кешбэк', icon: <Sparkles />, onClick: () => nav.open('cashback') },
      ]} />
      <Ops cat="card" nav={nav} empty="Пополнения и покупки картой появятся здесь" />
      <Section title="О карте">
        <Card className="py-1 divide-y divide-line">
          <Row label="Тип" value="VISA, виртуальная" muted />
          <Row label="Кешбэк" value={`1% ${CB_LABEL[state.cashback]}`} muted />
          <Row label="Лимит покупок в день" value={kzt(s.dailyLimit)} muted />
          <Row label="Оплата в интернете" value={s.online ? 'Включена' : 'Выключена'} muted />
          <Row label="Где хранятся деньги" value="На текущем счёте в банке" muted />
        </Card>
      </Section>
    </>
  )
}

function GoldTab({ nav }) {
  const { state, totals, money } = useStore()
  const g = state.balances.gold
  const nextGram = Math.max(1, Math.ceil(g + 1e-9))
  const cbGrams = state.txs.filter((t) => t.kind === 'cashback' && t.grams).reduce((s, t) => s + t.grams, 0)
  return (
    <>
      <div className="rounded-[24px] bg-vault text-white p-5 relative overflow-hidden isolate">
        <div className="bz-coin absolute -right-12 -top-12 w-44 h-44 rounded-full -z-10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-vault via-vault/85 to-transparent" />
        <div className="text-[12px] text-white/65">Баланс золота · bzGOLD</div>
        <div className="font-display font-semibold text-[30px] leading-tight mt-1 num">{grams(g)}</div>
        <div className="text-[13px] text-white/65 num">≈ {money(totals.gold)} по текущей котировке</div>
        <div className="mt-4">
          <div className="flex justify-between text-[12px] text-white/75 mb-1.5">
            <span>До {nextGram} г</span>
            <span className="num">{grams(Math.max(0, nextGram - g))} осталось</span>
          </div>
          <div className="h-2 rounded-full bg-white/12 overflow-hidden">
            <div className="h-full rounded-full bg-gold-fill transition-all duration-700" style={{ width: `${Math.min(1, g / nextGram) * 100}%` }} />
          </div>
        </div>
        <div className="mt-3 text-[13px] text-gold-2 flex items-center gap-1.5"><Sparkles size={14} /> Из кешбэка: {grams(cbGrams)}</div>
      </div>
      <Actions items={[
        { label: 'Купить', icon: <ArrowDownToLine />, onClick: () => nav.open('trade', { asset: 'gold', mode: 'buy' }), primary: true },
        { label: 'Продать', icon: <ArrowUpFromLine />, onClick: () => nav.open('trade', { asset: 'gold', mode: 'sell' }), disabled: g * PRICES.gold < 500 },
        { label: 'График', icon: <LineChart />, onClick: () => nav.tab('gold') },
        { label: 'Кешбэк', icon: <Sparkles />, onClick: () => nav.open('cashback') },
      ]} />
      <Ops cat="gold" nav={nav} empty="Покупки золота и кешбэк появятся здесь" />
      <Section title="О золоте">
        <Card className="py-1 divide-y divide-line">
          <Row label="1 bzGOLD" value="1 г золота 999,9" muted />
          <Row label="Обеспечение" value="Физический металл 1:1" muted />
          <Row label="Последний аудит" value={CUSTODY.lastAudit} muted />
          <Row label="Кешбэк" value="1% от покупки → мг по текущей цене" muted />
        </Card>
        <button onClick={() => nav.tab('gold')} className="text-[13px] font-semibold flex items-center gap-1 px-1">
          <ShieldCheck size={14} /> Где хранится и как считается кешбэк <ChevronRight size={14} />
        </button>
      </Section>
    </>
  )
}

function ListTab({ nav, ids, kind }) {
  const { state, prices, totals, money } = useStore()
  const isCrypto = kind === 'crypto'
  const own = isCrypto ? totals.crypto : totals.stocks
  const connected = PARTNERS.filter((p) => state.partners[p.id])
  return (
    <>
      <Card>
        <Label>{isCrypto ? 'Баланс крипты' : 'Баланс акций'}</Label>
        <div className="font-display font-semibold text-[28px] num mt-1">{money(own + (isCrypto ? totals.partners : 0))}</div>
        {isCrypto && totals.partners > 0 && (
          <div className="text-[12px] text-mute mt-1 num">В Bozzihyra {money(own)} · на биржах {money(totals.partners)}</div>
        )}
        {!isCrypto && <div className="text-[12px] text-mute mt-1">Токенизированные акции, дробные доли от 1 000 ₸</div>}
      </Card>

      <Section title={isCrypto ? 'Мои монеты' : 'Акции'}>
        <Card className="py-1">
          {ids.map((id) => {
            const a = ASSETS[id]
            const held = state.balances[id]
            const ch = dayChange(id)
            return (
              <button key={id} onClick={() => nav.open('asset', { id })}
                className="w-full flex items-center gap-3 py-3 border-b border-line last:border-0 text-left">
                <AssetIcon asset={a} size={38} />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium">{a.name}</div>
                  <div className="text-[12px] text-mute num truncate">{held > 0 ? qty(a, held) : a.symbol} · {kzt(prices[id])}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[14px] num font-medium">{held > 0 ? money(held * prices[id]) : 'Купить'}</div>
                  <div className={`text-[12px] num ${ch >= 0 ? 'text-up' : 'text-down'}`}>{pct(ch)} за день</div>
                </div>
              </button>
            )
          })}
        </Card>
      </Section>

      {isCrypto && (
        <Section title="На биржах-партнёрах" action={
          <button onClick={() => nav.tab('partners')} className="text-[13px] font-semibold underline underline-offset-2">Управлять</button>
        }>
          {connected.length ? (
            <Card className="py-1">
              {connected.map((p) => {
                const b = state.partners[p.id].balances
                return (
                  <div key={p.id} className="flex items-center gap-3 py-3 border-b border-line last:border-0">
                    <span className="w-9 h-9 rounded-xl grid place-items-center text-white font-display font-semibold text-[13px]" style={{ background: p.color }}>{p.name[0]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium">{p.name}</div>
                      <div className="text-[12px] text-mute num truncate">{usdt(b.USDT)}{b.BTC ? ` · ${qty(ASSETS.btc, b.BTC)}` : ''}</div>
                    </div>
                    <div className="text-[14px] num">{kzt(b.USDT * PRICES.usdt + (b.BTC || 0) * PRICES.btc)}</div>
                  </div>
                )
              })}
            </Card>
          ) : (
            <Empty>Подключите биржу из реестра МФЦА, чтобы видеть её балансы здесь</Empty>
          )}
        </Section>
      )}

      <Ops cat={kind} nav={nav} empty={isCrypto ? 'Покупки и переводы крипты появятся здесь' : 'Покупки акций появятся здесь'} />

      <Section title={isCrypto ? 'О крипте' : 'О токенизированных акциях'}>
        <Card className="py-1 divide-y divide-line">
          {isCrypto ? (
            <>
              <Row label="Хранение в Bozzihyra" value="Кастодиальное, без seed-фраз" muted />
              <Row label="На биржах" value="Хранится у партнёра" muted />
              <Row label="Партнёры" value="Только из реестра МФЦА" muted />
              <Row label="Спред" value="1,0% + комиссия 0,2%" muted />
              <Row label="Риск" value="Высокая волатильность" muted />
            </>
          ) : (
            <>
              <Row label="Что это" value="Цифровое право на акцию" muted />
              <Row label="Обеспечение" value="Акция у кастодиана 1:1" muted />
              <Row label="Минимум" value="1 000 ₸, дробные доли" muted />
              <Row label="Спред" value="0,3% + комиссия 0,2%" muted />
              <Row label="Риск" value="Цена может снижаться" muted />
            </>
          )}
        </Card>
      </Section>
    </>
  )
}

