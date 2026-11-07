import { useEffect, useRef, useState } from 'react'
import { Glass, Input, Slider, Switch } from 'glisse'
import { Check, AlertCircle, Phone, Coffee, Clock, TrendingUp, TrendingDown, ChevronLeft } from 'lucide-react'
import { useStore } from '../store.jsx'
import { GOALS, FEES, ASSETS, STOCKS, CRYPTO, dayChange } from '../lib/mock.js'
import { kzt, pct } from '../lib/format.js'
import { Button, Notice, Choice } from '../components/ui.jsx'
import GoldBar from '../components/GoldBar.jsx'

export function Wordmark() {
  return (
    <span className="font-display font-semibold text-[18px] tracking-tight">
      bozzhyra<span className="text-gold-fill">.</span>
    </span>
  )
}

// Плавный счётчик от 0 до target, когда run = true.
// На таймере, а не на requestAnimationFrame: так он доходит до конца и в фоновой вкладке.
function useCount(target, run, ms = 900) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!run) { setV(0); return }
    const t0 = Date.now()
    const id = setInterval(() => {
      const k = Math.min(1, (Date.now() - t0) / ms)
      setV(target * (1 - Math.pow(1 - k, 3)))
      if (k >= 1) clearInterval(id)
    }, 16)
    return () => clearInterval(id)
  }, [target, run, ms])
  return v
}

/* ---------- Шаг 1. Кешбэк в граммах ---------- */
function StepCashback({ price: live }) {
  const [price] = useState(live) // цена на момент оплаты, чтобы счётчик не перезапускался с каждой котировкой
  const [paid, setPaid] = useState(false)
  const g = (1500 * FEES.cashbackRate) / price
  const mg = useCount(g * 1000, paid, 1100)
  useEffect(() => { const id = setTimeout(() => setPaid(true), 2600); return () => clearTimeout(id) }, [])
  const particles = Array.from({ length: 12 }, (_, i) => i)
  return (
    <div className="relative h-[300px] flex flex-col items-center justify-between">
      <div className="flex flex-col items-center gap-2">
        <GoldBar size={140} label="Слиток золота: сюда приходит кешбэк" />
        <div className="font-display font-semibold text-[28px] num" aria-live="polite">+{mg.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} мг</div>
        <div className="text-[12px] text-mute num">≈ {kzt(15, 2)} в золоте</div>
      </div>
      <div className="relative w-full">
        {paid && particles.map((i) => (
          <span key={i} className="bz-particle" style={{
            left: `calc(50% + ${(i - 6) * 9}px)`, top: 8,
            '--dx': `${(6 - i) * 9}px`, '--dy': '-190px', animationDelay: `${i * 45}ms`,
          }} />
        ))}
        <div className={`bz-card flex items-center gap-3 transition ${paid ? 'opacity-60 scale-[.98]' : ''}`}>
          <span className="w-10 h-10 rounded-full bg-ink/6 grid place-items-center"><Coffee size={18} /></span>
          <div className="flex-1">
            <div className="text-[14px] font-medium">Coffee Boom</div>
            <div className="text-[12px] text-mute">{paid ? 'Оплачено · кешбэк 1%' : 'Покупка картой'}</div>
          </div>
          {paid
            ? <span className="text-[14px] num">−1 500 ₸</span>
            : <button onClick={() => setPaid(true)} className="h-9 px-4 rounded-full bg-ink text-paper text-[13px] font-semibold anim-ring">Оплатить</button>}
        </div>
      </div>
    </div>
  )
}

/* ---------- Шаг 2. Граммы те же, цена меняется ---------- */
function StepPrice({ price }) {
  const [move, setMove] = useState(0) // % изменения цены
  const [touched, setTouched] = useState(false)
  const held = 0.01 // 10 мг
  useEffect(() => {
    if (touched) return
    const t0 = performance.now()
    const id = setInterval(() => setMove(Math.round(Math.sin((performance.now() - t0) / 900) * 8)), 120)
    return () => clearInterval(id)
  }, [touched])
  const value = held * price * (1 + move / 100)
  const up = move >= 0
  return (
    <div className="h-[300px] flex flex-col justify-center gap-5">
      <div className="flex items-center justify-center gap-5">
        <div className="flex flex-col items-center gap-2">
          <GoldBar size={100} />
          <div className="font-display font-semibold text-[18px]">10 мг</div>
          <div className="text-[11px] text-mute">не меняется</div>
        </div>
        <div className="text-[22px] text-mute">=</div>
        <div className="flex flex-col items-center gap-2 min-w-[132px]">
          <div className={`h-20 flex items-end gap-1`}>
            {[0.55, 0.7, 0.62, 0.8, 0.74].map((h, i) => (
              <span key={i} className={`w-3.5 rounded-t-md transition-all duration-150 ${i === 4 ? (up ? 'bg-up' : 'bg-down') : 'bg-ink/15'}`}
                style={{ height: `${(i === 4 ? 0.74 + move / 40 : h) * 100}%` }} />
            ))}
          </div>
          <div className="font-display font-semibold text-[18px] num">{kzt(value)}</div>
          <div className={`text-[11px] num flex items-center gap-1 ${up ? 'text-up' : 'text-down'}`}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{move > 0 ? '+' : ''}{move}% цена золота
          </div>
        </div>
      </div>
      <div onPointerDown={() => setTouched(true)}>
        <label id="move-l" className="text-[12px] text-mute block text-center mb-2">Подвигайте цену золота</label>
        <Slider aria-labelledby="move-l" min={-10} max={10} step={1} value={move} onValueChange={(v) => { setTouched(true); setMove(v) }} />
      </div>
    </div>
  )
}

/* ---------- Шаг 3. Котировка и комиссия заранее ---------- */
function StepQuote({ price }) {
  const [left, setLeft] = useState(30)
  useEffect(() => { const id = setInterval(() => setLeft((l) => (l <= 1 ? 30 : l - 1)), 1000); return () => clearInterval(id) }, [])
  const fee = Math.max(FEES.minCommission, 20000 * FEES.commission)
  const net = 20000 - fee
  const s = ASSETS.gold.spread
  const rows = [
    ['Биржевая цена', `${kzt(price)} / г`],
    [`Спред ${(s * 100).toFixed(1)}%`, kzt(net - net / (1 + s))],
    [`Комиссия ${(FEES.commission * 100).toFixed(1)}%`, kzt(fee)],
    ['Спишем', kzt(20000)],
    ['Получите', `${(net / (price * (1 + s))).toLocaleString('ru-RU', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} г`],
  ]
  const C = 2 * Math.PI * 19
  return (
    <div className="h-[300px] flex flex-col justify-center gap-3">
      <div className="bz-card flex items-center gap-3 py-3">
        <div className="relative w-11 h-11">
          <svg viewBox="0 0 44 44" className="w-11 h-11 -rotate-90">
            <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(128,128,128,.25)" strokeWidth="4" />
            <circle cx="22" cy="22" r="19" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - left / 30)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-[13px] font-semibold num">{left}</span>
        </div>
        <div className="text-[13px]">
          <div className="font-semibold text-[14px] flex items-center gap-1.5"><Clock size={14} /> Цена зафиксирована</div>
          <div className="text-mute">30 секунд на решение</div>
        </div>
      </div>
      <div className="bz-card py-1">
        {rows.map(([k, v], i) => (
          <div key={k} className={`flex justify-between py-2 border-b border-line last:border-0 text-[14px] anim-stagger ${i === rows.length - 1 ? 'font-semibold' : ''}`}
            style={{ animationDelay: `${300 + i * 220}ms` }}>
            <span className={i === rows.length - 1 ? '' : 'text-mute'}>{k}</span><span className="num">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Шаг 4. Всё в одном балансе ---------- */
function StepMerge() {
  const [go, setGo] = useState(false)
  const total = useCount(952000, go, 1000)
  useEffect(() => { const id = setTimeout(() => setGo(true), 700); return () => clearTimeout(id) }, [])
  const chips = [
    ['Карта', -110, -150], ['Золото', 0, -160], ['Акции', 110, -150],
    ['Binance KZ', -110, -95], ['Bybit KZ', 0, -105], ['ATAIX', 110, -95],
  ]
  return (
    <div className="h-[300px] relative flex flex-col items-center justify-end pb-4">
      {chips.map(([label, x, y], i) => (
        <span key={label} className="bz-merge absolute left-1/2 bottom-24 -translate-x-1/2 px-3 h-8 rounded-full bg-card border border-line text-[13px] font-medium grid place-items-center whitespace-nowrap"
          style={{
            transform: go ? 'translate(-50%, 40px) scale(.4)' : `translate(calc(-50% + ${x}px), ${y}px)`,
            opacity: go ? 0 : 1, transitionDelay: `${i * 70}ms`,
          }}>{label}</span>
      ))}
      <div className={`bz-card w-full text-center transition-transform duration-500 ${go ? 'scale-[1.03]' : ''}`} style={{ transitionDelay: '600ms' }}>
        <div className="text-[11px] uppercase tracking-[.08em] text-mute">Всего</div>
        <div className="font-display font-semibold text-[28px] num">{kzt(total)}</div>
        <div className="text-[12px] text-mute">Банк, золото, акции и биржи МФЦА</div>
      </div>
    </div>
  )
}

const TUTORIAL = [
  { title: 'Кешбэк, который весит', text: '1% каждой покупки картой превращается в миллиграммы настоящего золота. Это не баллы: их можно хранить, продать или докупить.', Scene: StepCashback },
  { title: 'Граммы ваши, цена меняется', text: 'Количество золота не меняется. Его стоимость в тенге следует за рынком и может как расти, так и снижаться. Это не депозит.', Scene: StepPrice },
  { title: 'Цена и комиссия видны заранее', text: 'Перед каждой покупкой фиксируем цену на 30 секунд и показываем спред и комиссию. Без мелкого шрифта.', Scene: StepQuote },
  { title: 'Всё в одном балансе', text: 'Карта, золото, акции и биржи из реестра МФЦА на одном экране. Активы на биржах остаются у партнёра, мы показываем их для удобства.', Scene: StepMerge },
]

/* ---------- Приветствие ---------- */
function Welcome({ onSignup, onGuest, onLogin }) {
  const { prices } = useStore()
  const tick = ['gold', ...STOCKS, ...CRYPTO].map((id) => ({ a: ASSETS[id], ch: dayChange(id), p: prices[id] }))
  return (
    <div className="flex-1 flex flex-col px-6 pt-[max(28px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))] overflow-hidden">
      <Wordmark />
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <div className="relative">
          <GoldBar size={240} label="Слиток золота bzGOLD, его можно покрутить" />
          <Glass className="bz-glass-strong absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 whitespace-nowrap">
            <span className="text-[13px] font-semibold num">1 г = {kzt(prices.gold)}</span>
          </Glass>
        </div>
        <div>
          <h1 className="font-display font-semibold text-[28px] leading-[1.12] text-balance">Банк, где кешбэк копится в золоте</h1>
          <p className="text-[15px] text-mute mt-3 leading-relaxed">Карта, золото, акции и крипта в одном приложении</p>
        </div>
      </div>
      <div className="-mx-6 mb-5 overflow-hidden border-y border-line py-2" aria-label="Котировки">
        <div className="flex gap-6 w-max anim-ticker">
          {[...tick, ...tick].map(({ a, ch, p }, i) => (
            <span key={i} className="text-[12px] num whitespace-nowrap">
              <span className="font-semibold">{a.symbol}</span> {kzt(p)} <span className={ch >= 0 ? 'text-up' : 'text-down'}>{pct(ch)}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button onClick={onSignup}>Открыть счёт</Button>
        <Button variant="ghost" onClick={onGuest}>Посмотреть рынок без регистрации</Button>
        <button onClick={onLogin} className="text-[14px] font-medium mt-2">Уже есть счёт? Войти</button>
      </div>
    </div>
  )
}

/* ---------- Онбординг целиком ---------- */
export default function Onboarding({ start = 'welcome', onGuest }) {
  const { state, dispatch, prices } = useStore()
  const [step, setStep] = useState(start) // welcome | t0..t3 | ready | phone | otp
  const [goal, setGoal] = useState(null)
  const [agree, setAgree] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState(false)
  const loginOnly = useRef(false)

  if (step === 'welcome') {
    return <Welcome
      onSignup={() => setStep('t0')}
      onGuest={() => { dispatch({ type: 'guest', value: true }); onGuest?.() }}
      onLogin={() => { loginOnly.current = true; setStep('phone') }} />
  }

  if (step.startsWith('t')) {
    const i = Number(step.slice(1))
    const { title, text, Scene } = TUTORIAL[i]
    return (
      <div className="flex-1 flex flex-col px-6 pt-[max(20px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep(i === 0 ? 'welcome' : `t${i - 1}`)} aria-label="Назад" className="w-8 h-8 -ml-1 grid place-items-center"><ChevronLeft size={22} /></button>
          <div className="flex-1 flex gap-1.5" aria-label={`Шаг ${i + 1} из ${TUTORIAL.length}`}>
            {TUTORIAL.map((_, j) => (
              <span key={j} className="h-1 flex-1 rounded-full bg-ink/12 overflow-hidden">
                <span className="block h-full bg-ink transition-all duration-500" style={{ width: j <= i ? '100%' : '0%' }} />
              </span>
            ))}
          </div>
          <button onClick={() => setStep('ready')} className="text-[13px] text-mute">Пропустить</button>
        </div>
        <div key={step} className="flex-1 flex flex-col justify-center anim-rise">
          <Scene price={prices.gold} />
          <h1 className="font-display font-semibold text-[24px] leading-[1.15] text-balance mt-6">{title}</h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-mute">{text}</p>
        </div>
        <Button onClick={() => setStep(i < TUTORIAL.length - 1 ? `t${i + 1}` : 'ready')}>{i < TUTORIAL.length - 1 ? 'Дальше' : 'Понятно'}</Button>
      </div>
    )
  }

  const Shell = ({ title, sub, children, footer, onBack }) => (
    <div className="flex-1 flex flex-col min-h-0 px-5 pt-[max(20px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} aria-label="Назад" className="w-8 h-8 -ml-1 grid place-items-center"><ChevronLeft size={22} /></button>
        <Wordmark />
        <span className="w-8" />
      </div>
      <h1 className="font-display font-semibold text-[22px] leading-tight text-balance">{title}</h1>
      {sub && <p className="text-[14px] text-mute mt-2 leading-relaxed">{sub}</p>}
      <div className="flex-1 overflow-y-auto no-scrollbar mt-5 -mx-1 px-1 pb-2">{children}</div>
      <div className="pt-3 flex flex-col gap-2">{footer}</div>
    </div>
  )

  if (step === 'ready') {
    return Shell({
      title: 'Почти готово', sub: 'Выберите, с чего начать. Это подстроит главный экран, изменить можно в любой момент.',
      onBack: () => setStep(`t${TUTORIAL.length - 1}`),
      footer: <Button disabled={!agree} onClick={() => setStep('phone')}>Создать счёт</Button>,
      children: (
        <div className="flex flex-col gap-3">
          {GOALS.map((g) => (
            <Choice key={g.id} selected={goal === g.id} onClick={() => setGoal(goal === g.id ? null : g.id)} className="py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-[15px]">{g.title}</div>
                  <div className="text-[13px] text-mute mt-0.5">{g.text}</div>
                </div>
                <span className={`shrink-0 w-6 h-6 rounded-full grid place-items-center ${goal === g.id ? 'bg-ink text-paper' : 'border border-line'}`}>
                  {goal === g.id && <Check size={14} strokeWidth={3} />}
                </span>
              </div>
            </Choice>
          ))}
          <div className="bz-card flex items-center gap-3 mt-2">
            <span id="risk-ack" className="flex-1 text-[13px] leading-snug">Понимаю, что золото, акции и крипта — не депозит, и их стоимость может снижаться</span>
            <Switch aria-labelledby="risk-ack" checked={agree} onCheckedChange={setAgree} />
          </div>
        </div>
      ),
    })
  }

  if (step === 'phone') {
    return Shell({
      title: loginOnly.current ? 'Вход в Bozzhyra' : 'Вход по номеру', sub: 'Тестовый режим: реальные данные не нужны.',
      onBack: () => setStep(loginOnly.current ? 'welcome' : 'ready'),
      footer: <Button onClick={() => setStep('otp')}>Получить код</Button>,
      children: (
        <>
          <label htmlFor="phone" className="text-[13px] text-mute block mb-2">Номер телефона</label>
          <Input id="phone" defaultValue="+7 701 555 12 34" inputMode="tel" icon={<Phone size={16} />} style={{ maxWidth: 'none', height: 52, borderRadius: 26 }} />
        </>
      ),
    })
  }

  const submitOtp = () => {
    if (otp === '1234') {
      if (state.guest) dispatch({ type: 'track', name: 'guest_signup' })
      dispatch({ type: 'onboard', goal: goal || 'save' })
    } else {
      setOtpError(true)
      dispatch({ type: 'track', name: 'error_otp' })
    }
  }

  return Shell({
    title: 'Введите код из SMS', sub: 'Отправили на +7 701 555 12 34. Тестовый код: 1234',
    onBack: () => setStep('phone'),
    footer: <Button disabled={otp.length !== 4} onClick={submitOtp}>Войти</Button>,
    children: (
      <>
        <label htmlFor="otp" className="sr-only">Код из SMS</label>
        <div className={`bz-card p-0 ${otpError ? 'ring-2 ring-down' : ''}`}>
          <input id="otp" value={otp} autoFocus inputMode="numeric" maxLength={4}
            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setOtpError(false) }}
            className="w-full h-16 bg-transparent px-4 text-center text-[28px] tracking-[.5em] font-display num outline-none" />
        </div>
        {otpError && (
          <div className="mt-3">
            <Notice tone="error" icon={<AlertCircle size={18} />} title="Неверный код">
              Проверьте цифры из SMS и введите код ещё раз. Осталось 2 попытки.
            </Notice>
          </div>
        )}
      </>
    ),
  })
}

