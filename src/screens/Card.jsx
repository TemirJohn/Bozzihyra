import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Wifi, ChevronRight, Sparkles, AlertCircle, X, Smartphone } from 'lucide-react'
import { useStore } from '../store.jsx'
import { MERCHANTS, FEES, PRICES } from '../lib/mock.js'
import { kzt, grams, btc } from '../lib/format.js'
import { Card as Box, Label, Button, Notice } from '../components/ui.jsx'

const CB_LABEL = { gold: 'в золоте', btc: 'в BTC', kzt: 'в тенге' }

export default function CardScreen({ nav }) {
  const { state, dispatch, goldPrice } = useStore()
  const [result, setResult] = useState(null) // {ok, merchant, amount, reward}

  const pay = (m) => {
    if (state.balances.kzt < m.amount) {
      dispatch({ type: 'track', name: 'error_insufficient' })
      setResult({ ok: false, merchant: m })
      return
    }
    const cb = m.amount * FEES.cashbackRate
    const reward = state.cashback === 'gold' ? `+${grams(cb / goldPrice)} золота ≈ ${kzt(cb, 2)}`
      : state.cashback === 'btc' ? `+${btc(cb / PRICES.btc)}` : `+${kzt(cb, 2)}`
    dispatch({ type: 'pay', merchant: m.name, cat: m.cat, amount: m.amount, goldPrice })
    setResult({ ok: true, merchant: m, reward })
  }

  return (
    <div className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-6 flex flex-col gap-4 relative">
      <h1 className="font-semibold text-[18px] px-1">Карта</h1>

      <div className="aspect-[1.586] max-w-full rounded-[22px] p-5 text-white flex flex-col justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #222830 0%, #14181d 60%, #3a2f17 100%)' }}>
        <div className="bz-coin absolute -right-16 -bottom-20 w-56 h-56 rounded-full opacity-80" />
        <div className="relative flex justify-between items-start">
          <span className="font-display font-semibold text-[17px]">bozzihyra<span className="text-gold-fill">.</span></span>
          <Wifi size={20} className="rotate-90 text-white/70" />
        </div>
        <div className="relative">
          <div className="text-[11px] text-white/55 uppercase tracking-[.08em]">Доступно</div>
          <div className="font-display font-semibold text-[24px] num">{kzt(state.balances.kzt)}</div>
          <div className="flex justify-between items-end mt-2 text-[13px] text-white/75">
            <span className="num tracking-wider">•••• 2026</span>
            <span>VISA · виртуальная</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[13px] text-mute px-1">
        <Smartphone size={15} /> Добавлена в Apple Pay (тест)
      </div>

      <Box role="button" tabIndex={0} onClick={() => nav.open('cashback')} onKeyDown={(e) => { if (e.key === 'Enter') nav.open('cashback') }}
        className="flex items-center gap-3 text-left cursor-pointer">
        <span className="w-10 h-10 rounded-full bg-gold-fill text-on-gold grid place-items-center"><Sparkles size={18} /></span>
        <div className="flex-1">
          <div className="font-semibold text-[15px]">Кешбэк 1% {CB_LABEL[state.cashback]}</div>
          <div className="text-[12px] text-mute">Изменить, в чём получать кешбэк</div>
        </div>
        <ChevronRight size={18} />
      </Box>

      <section>
        <Label className="mb-2">Симуляция оплаты</Label>
        <Box className="py-1">
          {MERCHANTS.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
              <span className="w-9 h-9 rounded-full bg-ink/6 grid place-items-center text-[13px] font-semibold">{m.name[0]}</span>
              <div className="flex-1">
                <div className="text-[14px] font-medium">{m.name}</div>
                <div className="text-[12px] text-mute">{m.cat}</div>
              </div>
              <span className="num text-[14px] mr-1">{kzt(m.amount)}</span>
              <Button size="sm" onClick={() => pay(m)}>Оплатить</Button>
            </div>
          ))}
        </Box>
        <p className="text-[12px] text-mute mt-2">Так выглядит покупка в магазине или онлайн. Списание с тестового баланса.</p>
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
                <Button className="mt-5" onClick={() => setResult(null)}>Готово</Button>
              </div>
            ) : (
              <div className="-mt-2 flex flex-col gap-4">
                <Notice tone="error" icon={<AlertCircle size={18} />} title="Оплата отклонена: недостаточно средств">
                  Покупка на {kzt(result.merchant.amount)}, а на карте {kzt(state.balances.kzt)}. Пополните баланс или переведите USDT с подключённой биржи.
                </Notice>
                <Button onClick={() => { setResult(null); nav.open('topup') }}>Пополнить баланс</Button>
                <Button variant="ghost" onClick={() => { setResult(null); nav.tab('partners') }}>Перевести с биржи</Button>
              </div>
            )}
          </div>
        </div>, document.getElementById('phone'))}
    </div>
  )
}
