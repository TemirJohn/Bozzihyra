import { useState } from 'react'
import { CheckCircle2, Landmark, AlertCircle } from 'lucide-react'
import { useStore } from '../store.jsx'
import { kzt } from '../lib/format.js'
import { Button, Panel, Notice, Chip, Card } from '../components/ui.jsx'

const MAX = 5_000_000

export default function TopUp({ nav }) {
  const { state, dispatch } = useStore()
  const [raw, setRaw] = useState('50000')
  const [done, setDone] = useState(false)
  const value = Number(raw) || 0
  const tooBig = value > MAX

  if (done) {
    return (
      <Panel title="" onClose={nav.close}
        footer={<>
          <Button onClick={() => nav.open('trade', { mode: 'buy' })}>Купить золото</Button>
          <Button variant="ghost" onClick={nav.close}>Готово</Button>
        </>}>
        <div className="flex flex-col items-center text-center pt-16">
          <CheckCircle2 size={56} className="text-up anim-pop" />
          <div className="mt-5 text-[14px] text-mute">Баланс пополнен</div>
          <div className="font-display font-semibold text-[30px] num">+{kzt(value)}</div>
          <div className="text-[13px] text-mute mt-2 num">Теперь на балансе {kzt(state.balances.kzt)}</div>
        </div>
      </Panel>
    )
  }

  return (
    <Panel title="Пополнить баланс" onClose={nav.close}
      footer={<Button data-coach="topup-submit" disabled={!value || tooBig} onClick={() => { dispatch({ type: 'topup', amount: value }); setDone(true) }}>
        Пополнить на {kzt(value)}
      </Button>}>
      <div className="text-center pt-6">
        <label htmlFor="topup" className="text-[13px] text-mute">Сумма в тенге</label>
        <input id="topup" value={raw} inputMode="numeric" autoFocus
          onChange={(e) => setRaw(e.target.value.replace(/\D/g, ''))}
          className="w-full text-center bg-transparent outline-none font-display font-semibold text-[40px] num mt-2" />
        <div className="flex justify-center gap-2 mt-3">
          {[10000, 50000, 200000].map((c) => (
            <Chip key={c} onClick={() => setRaw(String(c))}>{kzt(c)}</Chip>
          ))}
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-3">
        <Card className="flex items-center gap-3 py-3.5">
          <span className="w-10 h-10 rounded-full bg-ink/6 grid place-items-center"><Landmark size={18} /></span>
          <div className="flex-1">
            <div className="text-[14px] font-medium">С карты другого банка</div>
            <div className="text-[12px] text-mute">•••• 4417 · без комиссии</div>
          </div>
        </Card>
        {tooBig && (
          <Notice tone="error" icon={<AlertCircle size={18} />} title="Превышен лимит">
            За одну операцию можно пополнить до {kzt(MAX)}. Разделите сумму на несколько пополнений.
          </Notice>
        )}
        <p className="text-[12px] text-mute text-center">Тестовый режим: реальные деньги не списываются.</p>
      </div>
    </Panel>
  )
}
