import { useState } from 'react'
import { SegmentedControl } from 'glisse'
import { useStore } from '../store.jsx'
import { kzt } from '../lib/format.js'
import { Panel, Card, Empty } from '../components/ui.jsx'
import TxRow, { TX_FILTERS } from '../components/TxRow.jsx'

const dayLabel = (ts) => {
  const d = new Date(ts), today = new Date()
  const y = new Date(); y.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Сегодня'
  if (d.toDateString() === y.toDateString()) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export default function History({ filter: initial = 'all', nav }) {
  const { state } = useStore()
  const [filter, setFilter] = useState(initial)
  const list = state.txs.filter((t) => filter === 'all' || t.cat === filter)
  const spent = list.filter((t) => t.kind === 'pay').reduce((s, t) => s - t.kzt, 0)
  const cashback = list.filter((t) => t.kind === 'cashback').reduce((s, t) => s + t.cashbackKzt, 0)

  const groups = []
  for (const t of list) {
    const label = dayLabel(t.ts)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(t)
    else groups.push({ label, items: [t] })
  }

  return (
    <Panel title="История операций" onClose={nav.close}>
      <div className="flex flex-col gap-4">
        <div className="flex justify-center">
          <SegmentedControl className="bz-seg-5" aria-label="Фильтр" items={TX_FILTERS} value={filter} onValueChange={setFilter} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Card className="py-3">
            <div className="text-[12px] text-mute">Покупки картой</div>
            <div className="font-display font-semibold text-[17px] num mt-0.5">{kzt(spent)}</div>
          </Card>
          <Card className="py-3">
            <div className="text-[12px] text-mute">Кешбэк начислен</div>
            <div className="font-display font-semibold text-[17px] num mt-0.5 text-gold">{kzt(cashback, 2)}</div>
          </Card>
        </div>
        {groups.length === 0 ? <Empty>В этой категории пока нет операций</Empty> : groups.map((g) => (
          <section key={g.label} className="flex flex-col gap-2">
            <div className="text-[13px] text-mute font-medium px-1">{g.label}</div>
            <Card className="py-1">{g.items.map((t) => <TxRow key={t.id} t={t} />)}</Card>
          </section>
        ))}
      </div>
    </Panel>
  )
}
