import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ScanFace, Delete, CheckCircle2 } from 'lucide-react'
import { useStore } from '../store.jsx'
import { Wordmark } from '../screens/Onboarding.jsx'

export const TEST_PIN = '1234'

// Цифровая клавиатура для кода из 4 цифр. onComplete(code) возвращает true, если код верный.
export function PinPad({ onComplete, title = 'Введите код', hint }) {
  const { state } = useStore()
  hint = hint ?? `Тестовый код: ${state.settings.pin}`
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  const press = (d) => {
    if (code.length >= 4) return
    const next = code + d
    setCode(next)
    setError(false)
    if (next.length === 4) {
      setTimeout(() => {
        if (!onComplete(next)) { setError(true); setCode('') }
      }, 150)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <div className="font-semibold text-[17px]">{title}</div>
        <div className={`text-[13px] mt-1 ${error ? 'text-down' : 'text-mute'}`} role={error ? 'alert' : undefined}>
          {error ? 'Неверный код. Попробуйте ещё раз.' : hint}
        </div>
      </div>
      <div key={error ? 'e' : 'ok'} className={`flex gap-4 ${error ? 'anim-shake' : ''}`} aria-label={`Введено цифр: ${code.length} из 4`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`w-3.5 h-3.5 rounded-full border-2 ${error ? 'border-down' : 'border-ink'} ${i < code.length ? 'bg-ink' : ''}`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-x-6 gap-y-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} onClick={() => press(d)} className="w-[72px] h-[72px] rounded-full bg-ink/6 text-[26px] font-display num active:bg-ink/15">{d}</button>
        ))}
        <span />
        <button onClick={() => press('0')} className="w-[72px] h-[72px] rounded-full bg-ink/6 text-[26px] font-display num active:bg-ink/15">0</button>
        <button onClick={() => setCode(code.slice(0, -1))} aria-label="Стереть" className="w-[72px] h-[72px] rounded-full grid place-items-center text-mute">
          <Delete size={24} />
        </button>
      </div>
    </div>
  )
}

// Имитация сканирования лица: через 1,3 сек успех
function FaceScan({ onSuccess, label }) {
  const [done, setDone] = useState(false)
  const cb = useRef(onSuccess)
  cb.current = onSuccess
  useEffect(() => {
    const a = setTimeout(() => setDone(true), 1300)
    const b = setTimeout(() => cb.current(), 1800)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [])
  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`w-24 h-24 rounded-[28px] grid place-items-center ${done ? 'bg-up/12 text-up' : 'bg-ink/6 anim-scan'}`}>
        {done ? <CheckCircle2 size={44} className="anim-pop" /> : <ScanFace size={46} strokeWidth={1.5} />}
      </div>
      <div className="text-[15px] font-medium" role="status">{done ? 'Готово' : label}</div>
    </div>
  )
}

// Подтверждение действия: Face ID, если включён, иначе код
export function BioGate({ reason, onSuccess, onCancel }) {
  const { state } = useStore()
  const [mode, setMode] = useState(state.settings.biometrics ? 'face' : 'pin')
  return createPortal(
    <div className="absolute inset-0 z-[60] bg-black/45 flex items-end" onClick={onCancel}>
      <div className="w-full bg-paper rounded-t-[28px] px-5 pt-6 pb-[max(20px,env(safe-area-inset-bottom))] anim-slide flex flex-col items-center gap-5"
        onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <div className="text-[12px] uppercase tracking-[.08em] text-mute">Подтверждение</div>
          <div className="font-semibold text-[16px] mt-1 text-balance">{reason}</div>
        </div>
        {mode === 'face'
          ? <FaceScan onSuccess={onSuccess} label="Смотрите на экран" />
          : <PinPad title="Код входа" onComplete={(c) => { if (c === state.settings.pin) { onSuccess(); return true } return false }} />}
        <div className="flex gap-6 text-[14px] font-medium">
          {mode === 'face' && <button onClick={() => setMode('pin')}>Ввести код</button>}
          <button onClick={onCancel} className="text-mute">Отмена</button>
        </div>
      </div>
    </div>,
    document.getElementById('phone'))
}

// Экран входа при открытии приложения
export function LockScreen({ onUnlock }) {
  const { state } = useStore()
  const [mode, setMode] = useState(state.settings.biometrics ? 'face' : 'pin')
  return (
    <div className="absolute inset-0 z-[70] bg-paper flex flex-col items-center justify-between px-6 pt-[max(48px,env(safe-area-inset-top))] pb-[max(28px,env(safe-area-inset-bottom))]">
      <div className="flex flex-col items-center gap-3">
        <Wordmark />
        <span className="w-14 h-14 rounded-full bg-vault text-white grid place-items-center font-display font-semibold text-[20px] mt-4">{state.user.name[0]}</span>
        <div className="text-[15px]">{state.user.name}</div>
      </div>
      {mode === 'face'
        ? <FaceScan onSuccess={onUnlock} label="Вход по Face ID" />
        : <PinPad title="Код входа" onComplete={(c) => { if (c === state.settings.pin) { onUnlock(); return true } return false }} />}
      <button onClick={() => setMode(mode === 'face' ? 'pin' : 'face')} className="text-[14px] font-medium">
        {mode === 'face' ? 'Войти по коду' : state.settings.biometrics ? 'Войти по Face ID' : ''}
      </button>
    </div>
  )
}
