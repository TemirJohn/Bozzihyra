import { useEffect, useRef, useState } from 'react'

/*
  Гид с подсветкой. Каждый шаг ищет [data-coach="target"] внутри #phone, при необходимости
  переключает вкладку балансов на главной, прокручивает к элементу, затемняет всё вокруг
  и показывает описание. Пока идёт гид, нажатия по интерфейсу перехватываются: гид только показывает.
*/
export default function Tour({ steps, nav, onFinish }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)
  const step = steps[i]
  const finish = useRef(onFinish)
  finish.current = onFinish

  const next = () => (i < steps.length - 1 ? setI(i + 1) : finish.current(false))

  useEffect(() => {
    if (step.homeTab) nav.homeTab(step.homeTab)
    setRect(null)
    const phone = document.getElementById('phone')
    const t0 = Date.now()
    let scrolled = false
    const tick = () => {
      const el = phone.querySelector(`[data-coach="${step.target}"]`)
      if (!el) {
        // Элемента нет на экране (например, раздел пуст) — переходим к следующему шагу
        if (Date.now() - t0 > 2500) setI((n) => (n < steps.length - 1 ? n + 1 : n))
        return
      }
      if (!scrolled) { el.scrollIntoView({ block: 'center', behavior: 'instant' }); scrolled = true; return }
      const p = phone.getBoundingClientRect(), r = el.getBoundingClientRect()
      setRect({ x: r.left - p.left, y: r.top - p.top, w: r.width, h: r.height, pw: p.width, ph: p.height })
    }
    const start = setTimeout(tick, 60)
    const id = setInterval(tick, 120)
    phone.addEventListener('scroll', tick, true)
    addEventListener('resize', tick)
    return () => { clearTimeout(start); clearInterval(id); phone.removeEventListener('scroll', tick, true); removeEventListener('resize', tick) }
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const key = (e) => {
      if (e.key === 'Escape') finish.current(true)
      if (e.key === 'ArrowRight' || e.key === 'Enter') next()
    }
    addEventListener('keydown', key)
    return () => removeEventListener('keydown', key)
  })

  const pad = 6
  const below = rect ? rect.y + rect.h / 2 < rect.ph / 2 : true
  const width = rect ? Math.min(310, rect.pw - 32) : 310
  const left = rect ? Math.max(16, Math.min(rect.pw - width - 16, rect.x + rect.w / 2 - width / 2)) : 16
  const arrowX = rect ? Math.max(22, Math.min(width - 22, rect.x + rect.w / 2 - left)) : 0

  return (
    <div className="absolute inset-0 z-[55]" onClickCapture={(e) => { if (!e.target.closest('[data-tour-ui]')) { e.preventDefault(); e.stopPropagation() } }}>
      {rect
        ? <div className="absolute rounded-[20px] bz-spot pointer-events-none" style={{ left: rect.x - pad, top: rect.y - pad, width: rect.w + pad * 2, height: rect.h + pad * 2 }} />
        : <div className="absolute inset-0 bg-black/55" />}
      {rect && (
        <div key={i} data-tour-ui role="dialog" aria-label={step.title} className="absolute anim-rise"
          style={{ left, width, ...(below ? { top: rect.y + rect.h + pad + 14 } : { bottom: rect.ph - rect.y + pad + 14 }) }}>
          <div className="relative bg-card text-ink rounded-[20px] p-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,.5)]">
            <span className="absolute w-3.5 h-3.5 bg-card rotate-45" style={{ left: arrowX - 7, ...(below ? { top: -7 } : { bottom: -7 }) }} />
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[.08em] text-mute font-semibold">Гид · {i + 1} из {steps.length}</span>
              <div className="flex gap-1" aria-hidden="true">
                {steps.map((_, j) => <span key={j} className={`h-1.5 rounded-full transition-all ${j === i ? 'w-4 bg-ink' : 'w-1.5 bg-ink/20'}`} />)}
              </div>
            </div>
            <div className="font-semibold text-[16px] mt-2">{step.title}</div>
            <p className="text-[14px] leading-snug mt-1 text-mute">{step.text}</p>
            <div className="flex items-center justify-between mt-4">
              <button onClick={() => finish.current(true)} className="text-[13px] text-mute font-medium">Пропустить</button>
              <button onClick={next} autoFocus className="h-9 px-4 rounded-full bg-ink text-paper text-[13px] font-semibold">
                {i < steps.length - 1 ? 'Дальше' : 'Готово'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
