import { useState } from 'react'
import { Glass, Input } from 'glisse'
import { ShieldCheck, Layers, Sparkles, Check, AlertCircle, Phone } from 'lucide-react'
import { useStore } from '../store.jsx'
import { GOALS } from '../lib/mock.js'
import { Button, Notice, Choice } from '../components/ui.jsx'

const SLIDES = [
  {
    icon: Sparkles,
    title: 'Кешбэк, который весит',
    text: 'За каждую покупку картой вы получаете миллиграммы золота. Это не баллы: золото можно хранить, продать или докупить.',
    visual: '+15 мг',
  },
  {
    icon: Layers,
    title: 'Банк, биржа и кошелёк в одном',
    text: 'Подключайте биржи из реестра МФЦА, видьте все балансы на одном экране и платите картой.',
    visual: '1 портфель',
  },
  {
    icon: ShieldCheck,
    title: 'Цена и комиссия видны заранее',
    text: '1 bzGOLD = 1 грамм золота 999,9 в хранилище. До подтверждения вы видите котировку, спред и комиссию.',
    visual: '1 bzGOLD = 1 г',
  },
]

const QUIZ = [
  {
    q: 'Золотой токен — это депозит с гарантированным доходом?',
    options: ['Да, доход гарантирован', 'Нет, это актив, цена которого меняется'],
    correct: 1,
    explain: 'Токен не депозит и не застрахован как вклад. Его стоимость следует за ценой золота и может снижаться.',
  },
  {
    q: 'Золото подешевело на 5%. Что будет с вашим кешбэком в золоте?',
    options: ['Останется прежним в тенге', 'Его стоимость в тенге тоже снизится'],
    correct: 1,
    explain: 'Количество граммов не меняется, а стоимость в тенге меняется вместе с ценой золота, вверх и вниз.',
  },
]

function Shell({ title, sub, children, footer, stepNo }) {
  return (
    <div className="flex-1 flex flex-col min-h-0 px-5 pt-[max(24px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between mb-3">
        <Wordmark />
        <span className="text-[12px] text-mute">Шаг {stepNo} из 3</span>
      </div>
      <h1 className="font-display font-semibold text-[22px] leading-tight text-balance">{title}</h1>
      {sub && <p className="text-[14px] text-mute mt-2 leading-relaxed">{sub}</p>}
      <div className="flex-1 overflow-y-auto no-scrollbar mt-5 -mx-1 px-1 pb-2">{children}</div>
      <div className="pt-3 flex flex-col gap-2">{footer}</div>
    </div>
  )
}

export function Wordmark({ light }) {
  return (
    <span className={`font-display font-semibold text-[18px] tracking-tight ${light ? 'text-white' : ''}`}>
      bozzihyra<span className="text-gold-fill">.</span>
    </span>
  )
}

function Tick({ on }) {
  return (
    <span className={`shrink-0 w-6 h-6 rounded-full grid place-items-center ${on ? 'bg-ink text-paper' : 'border border-line'}`}>
      {on && <Check size={14} strokeWidth={3} />}
    </span>
  )
}

export default function Onboarding() {
  const { dispatch } = useStore()
  const [step, setStep] = useState(0) // 0-2 слайды, 3 цель, 4 тест, 5 телефон, 6 код
  const [goal, setGoal] = useState(null)
  const [answers, setAnswers] = useState({})
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState(false)

  const quizOk = QUIZ.every((q, i) => answers[i] === q.correct)
  const next = () => setStep((s) => s + 1)

  if (step <= 2) {
    const s = SLIDES[step]
    const Icon = s.icon
    return (
      <div className="flex-1 flex flex-col bg-paper text-ink px-6 pt-[max(24px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <Wordmark />
          <button onClick={() => setStep(3)} className="text-[13px] text-mute">Пропустить</button>
        </div>
        <div key={step} className="flex-1 flex flex-col justify-center anim-rise">
          <div className="relative mx-auto mb-10 w-52 h-52">
            <div className="bz-coin absolute inset-0 rounded-full" />
            <Glass className="bz-glass-strong absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-full py-3 text-center" data-theme="dark">
              <span className="font-display font-semibold text-[22px] text-white">{s.visual}</span>
            </Glass>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-ink text-paper rounded-full w-11 h-11 grid place-items-center">
              <Icon size={20} />
            </div>
          </div>
          <h1 className="font-display font-semibold text-[26px] leading-[1.15] text-balance">{s.title}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-mute">{s.text}</p>
        </div>
        <div className="flex gap-1.5 mb-5">
          {SLIDES.map((_, i) => (
            <span key={i} className={`h-1 rounded-full transition-all ${i === step ? 'w-8 bg-ink' : 'w-3 bg-ink/20'}`} />
          ))}
        </div>
        <Button onClick={next}>{step < 2 ? 'Далее' : 'Начать'}</Button>
      </div>
    )
  }

  if (step === 3) {
    return (
      <Shell stepNo={1} title="Что для вас главное?" sub="Подстроим главный экран и подсказки. Изменить можно в профиле."
        footer={<Button disabled={!goal} onClick={next}>Продолжить</Button>}>
        <div className="flex flex-col gap-3">
          {GOALS.map((g) => (
            <Choice key={g.id} selected={goal === g.id} onClick={() => setGoal(g.id)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-[16px]">{g.title}</div>
                  <div className="text-[14px] text-mute mt-1">{g.text}</div>
                </div>
                <Tick on={goal === g.id} />
              </div>
            </Choice>
          ))}
        </div>
      </Shell>
    )
  }

  if (step === 4) {
    return (
      <Shell stepNo={2} title="Две минуты о рисках" sub="Ответьте на два вопроса. Это нужно, чтобы открыть операции с золотом и криптой."
        footer={<Button disabled={!quizOk} onClick={next}>Понятно, продолжить</Button>}>
        <div className="flex flex-col gap-5">
          {QUIZ.map((q, i) => {
            const picked = answers[i]
            const answered = picked !== undefined
            return (
              <div key={i}>
                <div className="font-semibold text-[15px] mb-2.5">{q.q}</div>
                <div className="flex flex-col gap-2">
                  {q.options.map((o, j) => {
                    const sel = picked === j
                    const ring = sel ? (j === q.correct ? 'ring-2 ring-up' : 'ring-2 ring-down') : ''
                    return (
                      <Glass key={j} role="button" tabIndex={0} aria-pressed={sel}
                        onClick={() => setAnswers({ ...answers, [i]: j })}
                        onKeyDown={(e) => { if (e.key === 'Enter') setAnswers({ ...answers, [i]: j }) }}
                        className={`bz-card py-3 text-[14px] cursor-pointer ${ring}`}>{o}</Glass>
                    )
                  })}
                </div>
                {answered && (
                  <div className="mt-2.5">
                    <Notice tone={picked === q.correct ? 'ok' : 'error'}
                      title={picked === q.correct ? 'Верно' : 'Не совсем'}>{q.explain}</Notice>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Shell>
    )
  }

  if (step === 5) {
    return (
      <Shell stepNo={3} title="Вход по номеру" sub="Тестовый режим: реальные данные не нужны."
        footer={<Button onClick={next}>Получить код</Button>}>
        <label htmlFor="phone" className="text-[13px] text-mute block mb-2">Номер телефона</label>
        <Input id="phone" defaultValue="+7 701 555 12 34" inputMode="tel" icon={<Phone size={16} />} style={{ maxWidth: 'none', height: 52, borderRadius: 26 }} />
      </Shell>
    )
  }

  const submitOtp = () => {
    if (otp === '1234') {
      dispatch({ type: 'onboard', goal })
    } else {
      setOtpError(true)
      dispatch({ type: 'track', name: 'error_otp' })
    }
  }

  return (
    <Shell stepNo={3} title="Введите код из SMS" sub="Отправили на +7 701 555 12 34. Тестовый код: 1234"
      footer={<Button disabled={otp.length !== 4} onClick={submitOtp}>Войти</Button>}>
      <label htmlFor="otp" className="sr-only">Код из SMS</label>
      <Glass className={`bz-card p-0 ${otpError ? 'ring-2 ring-down' : ''}`}>
        <input id="otp" value={otp} autoFocus inputMode="numeric" maxLength={4}
          onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setOtpError(false) }}
          className="w-full h-16 bg-transparent px-4 text-center text-[28px] tracking-[.5em] font-display num outline-none" />
      </Glass>
      {otpError && (
        <div className="mt-3">
          <Notice tone="error" icon={<AlertCircle size={18} />} title="Неверный код">
            Проверьте цифры из SMS и введите код ещё раз. Осталось 2 попытки.
          </Notice>
        </div>
      )}
    </Shell>
  )
}
