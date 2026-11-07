import { useEffect, useState } from 'react'
import { Switch } from 'glisse'
import { AlertCircle, Clock, CheckCircle2, RefreshCw, Loader2, FastForward } from 'lucide-react'
import { useStore } from '../store.jsx'
import { ASSETS, FEES } from '../lib/mock.js'
import { kzt, qtyExact } from '../lib/format.js'
import { Button, Panel, Card, Row, Notice, Disclaimer, Chip } from '../components/ui.jsx'

function makeQuote(asset, mode, input, market) {
  const s = asset.spread
  const expiresAt = Date.now() + FEES.quoteTtl * 1000
  if (mode === 'buy') {
    const price = market * (1 + s)
    const fee = Math.max(FEES.minCommission, input * FEES.commission)
    const net = input - fee
    return { market, price, fee, spreadKzt: net - net / (1 + s), qty: net / price, kzt: input, expiresAt }
  }
  const price = market * (1 - s)
  const gross = input * price
  const fee = Math.max(FEES.minCommission, gross * FEES.commission)
  return { market, price, fee, spreadKzt: input * market - gross, qty: input, kzt: gross - fee, expiresAt }
}

const perUnit = (asset) => asset.kind === 'gold' ? 'г' : asset.kind === 'stock' ? 'шт' : asset.symbol
const RISK = {
  gold: 'Понимаю, что bzGOLD не депозит, а его стоимость может как расти, так и снижаться.',
  crypto: 'Понимаю, что криптовалюта сильно колеблется в цене и я могу потерять часть вложенных денег.',
  stock: 'Понимаю, что цена акции может снижаться, а прошлая динамика не гарантирует будущий результат.',
}

export default function Trade({ asset: assetId = 'gold', mode, nav }) {
  const { state, dispatch, prices } = useStore()
  const asset = ASSETS[assetId]
  const market = prices[assetId]
  const isBuy = mode === 'buy'
  const unit = perUnit(asset)
  const name = asset.kind === 'gold' ? 'золото' : asset.name

  const [step, setStep] = useState('input') // input | quote | processing | success
  const [raw, setRaw] = useState(isBuy ? '20000' : '')
  const [quote, setQuote] = useState(null)
  const [left, setLeft] = useState(FEES.quoteTtl)
  const [agree, setAgree] = useState(false)

  const value = Number(String(raw).replace(',', '.').replace(/\s/g, '')) || 0
  const bal = isBuy ? state.balances.kzt : state.balances[assetId]

  let error = null
  if (value > 0) {
    if (isBuy && value < FEES.minBuy) error = { title: 'Сумма меньше минимальной', text: `Минимальная покупка ${kzt(FEES.minBuy)}.` }
    else if (!isBuy && value * market < FEES.minSellKzt) error = { title: 'Слишком мало для продажи', text: `Минимальная продажа на ${kzt(FEES.minSellKzt)}.` }
    else if (value > bal + 1e-12) error = isBuy
      ? { title: 'Недостаточно средств', text: `На балансе ${kzt(bal)}. Пополните баланс или уменьшите сумму.`, topup: true }
      : { title: 'Недостаточно актива', text: `У вас ${qtyExact(asset, bal)}.` }
  }

  useEffect(() => {
    if (step !== 'quote' || !quote) return
    const tick = () => setLeft(Math.max(0, Math.ceil((quote.expiresAt - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [step, quote])

  const expired = step === 'quote' && left === 0
  useEffect(() => { if (expired) dispatch({ type: 'track', name: 'quote_expired' }) }, [expired, dispatch])

  const getQuote = () => {
    setQuote(makeQuote(asset, mode, value, market))
    setLeft(FEES.quoteTtl)
    setStep('quote')
  }

  const confirm = () => {
    setStep('processing')
    setTimeout(() => {
      dispatch({ type: mode, asset: assetId, kzt: quote.kzt, qty: quote.qty, price: quote.price, fee: quote.fee })
      setStep('success')
    }, 1300)
  }

  const title = `${isBuy ? 'Купить' : 'Продать'} ${name}`

  if (step === 'input') {
    const preview = value > 0 && !error ? makeQuote(asset, mode, value, market) : null
    const chips = isBuy ? [5000, 20000, 50000] : [0.25, 0.5, 1].map((k) => +(bal * k).toFixed(asset.kind === 'crypto' ? 6 : 4))
    return (
      <Panel title={title} onClose={nav.close}
        footer={<Button disabled={!value || !!error} onClick={getQuote}>Получить котировку</Button>}>
        <div className="text-center pt-6">
          <label htmlFor="amount" className="text-[13px] text-mute">{isBuy ? 'Сумма в тенге' : `Количество, ${unit}`}</label>
          <input id="amount" value={raw} autoFocus inputMode="decimal"
            onChange={(e) => setRaw(e.target.value.replace(/[^\d.,]/g, ''))}
            className={`w-full text-center bg-transparent outline-none font-display font-semibold text-[40px] num mt-2 ${error ? 'text-down' : ''}`}
            placeholder="0" />
          <div className="text-[14px] text-mute num -mt-1">{isBuy ? '₸' : asset.symbol}</div>
          <div className="text-[13px] text-mute mt-3 num">Доступно: {isBuy ? kzt(bal) : qtyExact(asset, bal)}</div>
          <div className="flex justify-center gap-2 mt-4">
            {chips.map((c, i) => (
              <Chip key={i} onClick={() => setRaw(String(c))}>{isBuy ? kzt(c) : ['25%', '50%', 'Всё'][i]}</Chip>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {isBuy && asset.kind === 'crypto' && state.settings.risk === 'conservative' && (
            <Notice tone="warn" icon={<AlertCircle size={18} />} title="Высокий риск для вашего профиля">
              В настройках выбран низкий профиль риска, а криптовалюта сильно колеблется в цене. Купить можно, но вложите только ту сумму, потерю которой готовы принять.
            </Notice>
          )}
          {error && (
            <Notice tone="error" icon={<AlertCircle size={18} />} title={error.title}
              action={error.topup && (
                <button onClick={() => nav.open('topup')} className="text-[13px] font-semibold underline">Пополнить баланс</button>
              )}>{error.text}</Notice>
          )}
          {preview && (
            <Card className="divide-y divide-line py-1">
              <Row label="Ориентировочно получите" value={isBuy ? `≈ ${qtyExact(asset, preview.qty)}` : `≈ ${kzt(preview.kzt)}`} strong />
              <Row label="Цена сейчас" value={`${kzt(market)} / ${unit}`} muted />
              <Row label="Спред и комиссия" value={`${(asset.spread * 100).toFixed(1)}% + ${(FEES.commission * 100).toFixed(1)}%`} muted />
            </Card>
          )}
          <p className="text-[12px] text-mute text-center">Точная цена фиксируется на {FEES.quoteTtl} секунд после запроса котировки.</p>
        </div>
      </Panel>
    )
  }

  if (step === 'quote') {
    const ratio = left / FEES.quoteTtl
    return (
      <Panel title="Проверьте условия" onBack={() => setStep('input')} onClose={nav.close}
        footer={expired ? (
          <Button onClick={getQuote}><RefreshCw size={18} /> Обновить котировку</Button>
        ) : (
          <Button disabled={!agree} onClick={confirm}>
            {isBuy ? `Купить за ${kzt(quote.kzt)}` : `Продать ${qtyExact(asset, quote.qty)}`}
          </Button>
        )}>
        <div className="flex flex-col gap-3 pt-2">
          {expired ? (
            <Notice tone="error" icon={<AlertCircle size={18} />} title="Котировка истекла">
              Цена могла измениться. Обновите котировку, чтобы увидеть актуальные условия. Деньги не списаны.
            </Notice>
          ) : (
            <Card className="flex items-center gap-3 p-3">
              <div className="relative w-11 h-11">
                <svg viewBox="0 0 44 44" className="w-11 h-11 -rotate-90">
                  <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(128,128,128,.25)" strokeWidth="4" />
                  <circle cx="22" cy="22" r="19" fill="none" stroke={left <= 10 ? '#e0892a' : '#d9aa45'} strokeWidth="4"
                    strokeLinecap="round" strokeDasharray={2 * Math.PI * 19} strokeDashoffset={2 * Math.PI * 19 * (1 - ratio)}
                    style={{ transition: 'stroke-dashoffset .25s linear' }} />
                </svg>
                <span className="absolute inset-0 grid place-items-center text-[13px] font-semibold num">{left}</span>
              </div>
              <div className="flex-1 text-[13px]">
                <div className="font-semibold text-[14px] flex items-center gap-1.5"><Clock size={14} /> Цена зафиксирована</div>
                <div className="text-mute">Подтвердите за {left} сек</div>
              </div>
              <button onClick={() => setQuote({ ...quote, expiresAt: Date.now() })}
                className="text-[11px] text-mute flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-line"
                title="Для демонстрации на защите">
                <FastForward size={12} /> демо
              </button>
            </Card>
          )}

          <Card className={`divide-y divide-line py-1 ${expired ? 'opacity-50' : ''}`}>
            <Row label="Биржевая цена" value={`${kzt(quote.market)} / ${unit}`} muted />
            <Row label={`Спред ${(asset.spread * 100).toFixed(1)}%`} hint="Разница с биржевой ценой" value={kzt(quote.spreadKzt)} muted />
            <Row label="Ваша цена" value={`${kzt(quote.price)} / ${unit}`} />
            <Row label={`Комиссия ${(FEES.commission * 100).toFixed(1)}%`} hint={`Минимум ${kzt(FEES.minCommission)}`} value={kzt(quote.fee)} muted />
            {isBuy ? (
              <>
                <Row label="Спишем" value={kzt(quote.kzt)} />
                <Row label="Получите" value={qtyExact(asset, quote.qty)} strong />
              </>
            ) : (
              <>
                <Row label="Продаёте" value={qtyExact(asset, quote.qty)} />
                <Row label="Зачислим на баланс" value={kzt(quote.kzt)} strong />
              </>
            )}
          </Card>

          <div className="flex gap-3 items-center p-1">
            <span id="agree-label" className="flex-1 text-[13px] leading-snug">{RISK[asset.kind]}</span>
            <Switch id="agree" aria-labelledby="agree-label" checked={agree} onCheckedChange={setAgree} />
          </div>
          <Disclaimer>{asset.about} Хранение кастодиальное. Продать можно в любое время по текущей котировке.</Disclaimer>
        </div>
      </Panel>
    )
  }

  if (step === 'processing') {
    return (
      <Panel title={title}>
        <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
          <Loader2 size={40} className="animate-spin text-gold" />
          <div className="font-semibold">Проводим операцию</div>
          <div className="text-[13px] text-mute">Обычно это занимает пару секунд</div>
        </div>
      </Panel>
    )
  }

  return (
    <Panel title="" onClose={nav.close}
      footer={<Button onClick={() => { nav.close(); nav.tab('home') }}>На главную</Button>}>
      <div className="flex flex-col items-center text-center pt-10">
        <div className={`anim-pop w-24 h-24 rounded-full grid place-items-center ${asset.kind === 'gold' ? 'bz-coin' : ''}`}
          style={asset.kind === 'gold' ? undefined : { background: asset.color }}>
          <CheckCircle2 size={40} className="text-white" />
        </div>
        <div className="mt-6 text-[14px] text-mute">{isBuy ? 'Актив на вашем счёте' : 'Деньги на балансе'}</div>
        <div className="font-display font-semibold text-[26px] num mt-1">
          {isBuy ? `+${qtyExact(asset, quote.qty)}` : `+${kzt(quote.kzt)}`}
        </div>
        <Card className="w-full mt-8 divide-y divide-line py-1 text-left">
          <Row label="Цена" value={`${kzt(quote.price)} / ${unit}`} muted />
          <Row label="Комиссия" value={kzt(quote.fee)} muted />
          <Row label="Теперь у вас" value={qtyExact(asset, state.balances[assetId])} />
        </Card>
      </div>
    </Panel>
  )
}
