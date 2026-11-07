import { useMemo } from 'react'
import { SegmentedControl } from 'glisse'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { HISTORY } from '../lib/mock.js'
import { kzt, dateShort } from '../lib/format.js'

export const RANGES = [
  { value: '7d', label: '7Д', days: 7, long: 'неделю' },
  { value: '30d', label: '1М', days: 30, long: 'месяц' },
  { value: '90d', label: '3М', days: 90, long: '3 месяца' },
  { value: '1y', label: '1Г', days: 365, long: 'год' },
]

export function useSeries(assetId, range, live) {
  return useMemo(() => {
    const r = RANGES.find((x) => x.value === range)
    const slice = HISTORY[assetId].slice(-r.days)
    const data = [...slice.slice(0, -1), { ...slice[slice.length - 1], price: live }]
    return { data, change: live / data[0].price - 1, range: r }
  }, [assetId, range, live])
}

export default function PriceChart({ data, color = '#d9aa45', unit = '1 шт', range, onRange }) {
  const prices = data.map((d) => d.price)
  const min = Math.min(...prices), max = Math.max(...prices)
  const pad = (max - min) * 0.15 || max * 0.01
  const gid = `fill-${color.slice(1)}`
  return (
    <div className="bz-card px-2 pt-3 pb-3">
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(128,128,128,.2)" strokeDasharray="3 4" />
            <XAxis dataKey="t" tickFormatter={dateShort} tick={{ fontSize: 10, fill: '#8b9189' }} axisLine={false} tickLine={false} minTickGap={40} />
            <YAxis domain={[min - pad, max + pad]} hide />
            <Tooltip
              formatter={(v) => [kzt(v), unit]}
              labelFormatter={(l) => new Date(l).toLocaleDateString('ru-RU')}
              contentStyle={{ borderRadius: 14, border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--fg)', fontSize: 12 }} />
            <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill={`url(#${gid})`}
              isAnimationActive={false} activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center mt-2">
        <SegmentedControl className="bz-seg" aria-label="Период графика" items={RANGES} value={range} onValueChange={onRange} />
      </div>
    </div>
  )
}
