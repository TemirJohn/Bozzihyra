import { useState } from 'react'
import { Check } from 'lucide-react'
import { useStore } from '../store.jsx'
import { grams, btc } from '../lib/format.js'
import { Button, Panel, Disclaimer, Choice } from '../components/ui.jsx'

export default function Cashback({ nav }) {
  const { state, dispatch, goldPrice, prices } = useStore()
  const [pick, setPick] = useState(state.cashback === 'kzt' ? 'gold' : state.cashback)
  const cb = 100 // 1% от 10 000 ₸

  const options = [
    {
      id: 'gold', title: 'Золото bzGOLD', tag: 'Рекомендуем',
      text: 'Граммы копятся с каждой покупки. Стоимость меняется вместе с ценой золота.',
      example: `+${grams(cb / goldPrice)}`,
    },
    {
      id: 'btc', title: 'Bitcoin',
      text: 'Сильнее колеблется в цене: может как вырасти, так и заметно упасть.',
      example: `+${btc(cb / prices.btc)}`,
    },
  ]

  return (
    <Panel title="Кешбэк" onClose={nav.close}
      footer={<Button disabled={pick === state.cashback}
        onClick={() => { dispatch({ type: 'setCashback', value: pick }); nav.close() }}>Сохранить выбор</Button>}>
      <p className="text-[14px] text-mute pt-1">1% с каждой покупки картой. Выберите, в чём его получать. Пример для покупки на 10 000 ₸:</p>
      <div className="flex flex-col gap-3 mt-4">
        {options.map((o) => {
          const sel = pick === o.id
          return (
            <Choice key={o.id} selected={sel} onClick={() => setPick(o.id)}>
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 shrink-0 w-6 h-6 rounded-full grid place-items-center ${sel ? 'bg-ink text-paper' : 'border border-line'}`}>
                  {sel && <Check size={14} strokeWidth={3} />}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[16px]">{o.title}</span>
                    {o.tag && <span className="text-[11px] font-semibold text-gold bg-gold-soft px-2 py-0.5 rounded-full">{o.tag}</span>}
                  </div>
                  <div className="text-[13px] text-mute mt-1 leading-snug">{o.text}</div>
                </div>
                <span className="num text-[14px] font-semibold text-right">{o.example}</span>
              </div>
            </Choice>
          )
        })}
      </div>
      <Disclaimer>Кешбэк начисляется по котировке на момент покупки. Золото и BTC — это активы, их стоимость может снижаться. Кешбэк можно продать в любой момент и получить тенге на карту.</Disclaimer>
    </Panel>
  )
}
