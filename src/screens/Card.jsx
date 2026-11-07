import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, Sparkles, AlertCircle, X, Smartphone, Snowflake, Repeat } from 'lucide-react'
import { useStore } from '../store.jsx'
import { ASSETS, MERCHANTS, FEES, PARTNERS, PRICES } from '../lib/mock.js'
import { kzt, qty } from '../lib/format.js'
import { Card as Box, Label, Button, Notice } from '../components/ui.jsx'
import { CardFace } from './CardControls.jsx'

const CB_LABEL = { gold: 'в золоте', btc: 'в BTC', kzt: 'в золоте' }

export default function CardScreen({ nav }) {
  const { state, dispatch, prices } = useStore()
  const s = state.settings
  const [result, setResult] = useState(null) // { ok, merchant, reward, convert } | { ok:false, merchant, title, reason, actions }

  const spentToday = state.txs
    .filter((t) => t.kind === 'pay' && new Date(t.ts).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum - t.kzt, 0)
  const onlineMcc = MERCHANTS.filter((m) => m.online).map((m) => m.mcc)
  const spentOnline = state.txs
    .filter((t) => t.kind === 'pay' && onlineMcc.includes(t.mcc) && new Date(t.ts).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum - t.kzt, 0)

  const decline = (m, code, title, reason, actions) => {
    dispatch({ type: 'payDeclined', code, merchant: m.name, reason })
    setResult({ ok: false, merchant: m, title, reason, actions })
  }

  const pay = (m) => {
    if (s.frozen) return decline(m, 'frozen', 'Карта заморожена',
      'Оплата отклонена, потому что карта заморожена. Разморозьте её, чтобы платить.', ['unfreeze'])
    if (m.online && !s.online) return decline(m, 'online_off', 'Оплата в интернете выключена',
      `${m.name} — онлайн-покупка. Включите оплату в интернете.`, ['online'])
    if (m.sub && !s.subs) return decline(m, 'subs_off', 'Подписки запрещены',
      `${m.name} — автосписание по подписке. Разрешите подписки в настройках онлайн-оплаты.`, ['online'])
    if (m.foreign && !s.foreign) return decline(m, 'foreign_off', 'Зарубежные сайты запрещены',
      `${m.name} — зарубежный сервис. Разрешите оплату на зарубежных сайтах.`, ['online'])
    if (m.online && spentOnline + m.amount > s.onlineLimit) return decline(m, 'online_limit', 'Превышен онлайн-лимит',
      `Сегодня онлайн потрачено ${kzt(spentOnline)} из ${kzt(s.onlineLimit)}. Увеличьте онлайн-лимит или попробуйте завтра.`, ['limits'])
    if (spentToday + m.amount > s.dailyLimit) return decline(m, 'limit', 'Превышен дневной лимит',
      `Сегодня уже потрачено ${kzt(spentToday)} из ${kzt(s.dailyLimit)}. Увеличьте лимит или попробуйте завтра.`, ['limits'])

    let convert = null
    const lack = m.amount - state.balances.kzt
    if (lack > 0) {
      // Автоконвертация: докупаем недостающие ₸ из USDT на подключённой бирже
      const need = lack / (PRICES.usdt * (1 - FEES.transferFee))
      const p = s.autoConvert && PARTNERS.find((x) => state.partners[x.id]?.balances.USDT >= need)
      if (!p) return decline(m, 'insufficient', 'Недостаточно средств',
        `Покупка на ${kzt(m.amount)}, а на карте ${kzt(state.balances.kzt)}. Пополните баланс${s.autoConvert ? ' или подключите биржу с USDT' : ' или включите автоконвертацию USDT'}.`, ['topup', 'partners'])
      const usdtAmt = Math.ceil(need * 100) / 100
      convert = { id: p.id, name: p.name, usdt: usdtAmt, kzt: usdtAmt * PRICES.usdt * (1 - FEES.transferFee) }
    }

    const cb = m.amount * FEES.cashbackRate
    const reward = state.cashback === 'gold' ? `+${qty(ASSETS.gold, cb / prices.gold)} золота ≈ ${kzt(cb, 2)}`
      : state.cashback === 'btc' ? `+${qty(ASSETS.btc, cb / prices.btc)}` : `+${kzt(cb, 2)}`
    dispatch({ type: 'pay', merchant: m.name, cat: m.cat, mcc: m.mcc, amount: m.amount, prices, convert })
    setResult({ ok: true, merchant: m, reward, convert })
  }

  const ACTIONS = {
    unfreeze: <Button key="u" onClick={() => { setResult(null); nav.open('freeze') }}>Разморозить карту</Button>,
    online: <Button key="o" onClick={() => { setResult(null); nav.open('online') }}>Настройки онлайн-оплаты</Button>,
    limits: <Button key="l" onClick={() => { setResult(null); nav.open('limits') }}>Изменить лимиты</Button>,
    topup: <Button key="t" onClick={() => { setResult(null); nav.open('topup') }}>Пополнить баланс</Button>,
    partners: <Button key="b" variant="ghost" onClick={() => { setResult(null); nav.tab('partners') }}>Биржи-партнёры</Button>,
  }

  return (
    <div className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-6 flex flex-col gap-4 relative">
      <h1 className="font-semibold text-[18px] px-1">Карта</h1>

      <CardFace onClick={() => nav.open('cardPage')} />
      <p className="text-[12px] text-mute text-center -mt-2">Нажмите на карту: реквизиты, заморозка, лимиты</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-mute px-1">
        <span className="flex items-center gap-1.5"><Smartphone size={15} /> Apple Pay (тест)</span>
        <span className="num">Сегодня {kzt(spentToday)} из {kzt(s.dailyLimit)}</span>
        {s.autoConvert && <span className="flex items-center gap-1.5"><Repeat size={14} /> Автоконвертация USDT</span>}
      </div>

      {s.frozen && (
        <Notice tone="warn" icon={<Snowflake size={18} />} title="Карта заморожена"
          action={<button className="text-[13px] font-semibold underline" onClick={() => nav.open('freeze')}>Разморозить</button>}>
          Оплаты будут отклоняться, пока вы не разморозите карту.
        </Notice>
      )}

      <Box role="button" tabIndex={0} onClick={() => nav.open('cashback')} onKeyDown={(e) => { if (e.key === 'Enter') nav.open('cashback') }}
        className="flex items-center gap-3 text-left cursor-pointer">
        <span className="w-10 h-10 rounded-full bg-ink text-paper grid place-items-center"><Sparkles size={18} /></span>
        <div className="flex-1">
          <div className="font-semibold text-[15px]">Кешбэк 1% {CB_LABEL[state.cashback]}</div>
          <div className="text-[12px] text-mute">Изменить, в чём получать кешбэк</div>
        </div>
        <ChevronRight size={18} />
      </Box>

      <section>
        <Label className="mb-2 px-1">Симуляция оплаты</Label>
        <Box className="py-1">
          {MERCHANTS.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
              <span className="w-9 h-9 rounded-full bg-ink/6 grid place-items-center text-[13px] font-semibold">{m.name[0]}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium">{m.name}</div>
                <div className="text-[12px] text-mute">{m.cat}</div>
              </div>
              <span className="num text-[14px] mr-1">{kzt(m.amount)}</span>
              <Button size="sm" data-coach={`merchant-${m.id}`} onClick={() => pay(m)}>Оплатить</Button>
            </div>
          ))}
        </Box>
        <p className="text-[12px] text-mute mt-2 px-1">Так выглядит покупка в магазине или онлайн. Списание с тестового баланса.</p>
      </section>

      {result && createPortal(
        <div className="absolute inset-0 z-40 bg-black/40 flex items-end" onClick={() => setResult(null)}>
          <div className="w-full bg-paper rounded-t-[28px] p-5 pb-[max(20px,env(safe-area-inset-bottom))] anim-slide" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end">
              <button aria-label="Закрыть" onClick={() => setResult(null)} className="w-9 h-9 rounded-full bg-ink/6 grid place-items-center"><X size={16} /></button>
            </div>
            {result.ok ? (
              <div className="text-center -mt-4">
                <div className="text-[14px] text-mute">Оплачено · {result.merchant.name}</div>
                <div className="font-display font-semibold text-[28px] num mt-1">{kzt(result.merchant.amount)}</div>
                <div className="anim-pop inline-flex items-center gap-2 mt-4 rounded-full bg-gold-soft text-gold px-4 py-2 font-semibold num text-[14px]">
                  <Sparkles size={16} /> {result.reward}
                </div>
                <div className="text-[12px] text-mute mt-2">Кешбэк 1% начислен по текущей котировке</div>
                {result.convert && (
                  <div className="mt-3 text-[12px] text-mute num">
                    Не хватало на карте: докупили {kzt(result.convert.kzt)} из {result.convert.usdt.toFixed(2)} USDT на {result.convert.name}
                  </div>
                )}
                <Button className="mt-5" onClick={() => setResult(null)}>Готово</Button>
              </div>
            ) : (
              <div className="-mt-2 flex flex-col gap-3">
                <Notice tone="error" icon={<AlertCircle size={18} />} title={`Оплата отклонена: ${result.title.toLowerCase()}`}>
                  {result.reason}
                </Notice>
                {result.actions.map((a) => ACTIONS[a])}
                <Button variant="ghost" onClick={() => { setResult(null); nav.open('assistant', { ask: 'Почему отклонили оплату?' }) }}>Спросить помощника</Button>
              </div>
            )}
          </div>
        </div>, document.getElementById('phone'))}
    </div>
  )
}
