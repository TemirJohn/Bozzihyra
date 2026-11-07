import { useEffect, useState } from 'react'
import { Sparkles, ArrowDownLeft, Coins, Link2, AlertCircle, TrendingUp, Info, BellOff, X } from 'lucide-react'
import { useStore } from '../store.jsx'
import { time } from '../lib/format.js'
import { Panel, Card } from '../components/ui.jsx'

export const NOTE_ICON = {
  cashback: { icon: Sparkles, cls: 'bg-gold-soft text-gold' },
  topup: { icon: ArrowDownLeft, cls: 'bg-up/12 text-up' },
  trade: { icon: Coins, cls: 'bg-gold-soft text-gold' },
  partner: { icon: Link2, cls: 'bg-ink/6' },
  error: { icon: AlertCircle, cls: 'bg-down/12 text-down' },
  price: { icon: TrendingUp, cls: 'bg-ink/6' },
  info: { icon: Info, cls: 'bg-ink/6' },
}

export default function Notifications({ nav }) {
  const { state, dispatch } = useStore()
  // Запоминаем, что было непрочитанным в момент открытия, и сразу отмечаем всё прочитанным
  const [unreadIds] = useState(() => new Set(state.notifications.filter((n) => !n.read).map((n) => n.id)))
  useEffect(() => { dispatch({ type: 'readAll' }) }, [dispatch])

  const list = state.notifications
  return (
    <Panel title="Уведомления" onClose={nav.close}>
      {list.length === 0 ? (
        <div className="flex flex-col items-center text-center pt-24 gap-3 text-mute">
          <BellOff size={36} />
          <div className="text-[14px]">Пока тихо. Здесь появятся оплаты, кешбэк и операции.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
        <div className="flex justify-end px-1">
          <button onClick={() => dispatch({ type: 'clearNotes' })} className="text-[13px] font-semibold">Очистить всё</button>
        </div>
        <Card className="py-1">
          {list.map((n) => {
            const { icon: Icon, cls } = NOTE_ICON[n.kind] || NOTE_ICON.info
            const fresh = unreadIds.has(n.id)
            return (
              <div key={n.id} className="flex gap-3 py-3 border-b border-line last:border-0">
                <span className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${cls}`}><Icon size={16} /></span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <div className="text-[14px] font-medium flex-1">{n.title}</div>
                    {fresh && <span className="w-2 h-2 rounded-full bg-ink mt-1.5 shrink-0" aria-label="новое" />}
                    <button onClick={() => dispatch({ type: 'deleteNote', id: n.id })} aria-label="Удалить уведомление"
                      className="w-6 h-6 -mt-0.5 rounded-full grid place-items-center text-mute hover:bg-ink/6 shrink-0"><X size={14} /></button>
                  </div>
                  <div className="text-[13px] text-mute leading-snug">{n.text}</div>
                  <div className="text-[11px] text-mute mt-1">{time(n.ts)}</div>
                </div>
              </div>
            )
          })}
        </Card>
        </div>
      )}
    </Panel>
  )
}
