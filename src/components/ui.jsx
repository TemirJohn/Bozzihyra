import { Button as GButton } from 'glisse'
import { ChevronLeft, X } from 'lucide-react'

// Основная кнопка: filled = золотая, ghost = стекло, danger = стекло с красным текстом
export function Button({ variant = 'primary', size = 'lg', className = '', children, ...props }) {
  const glass = variant === 'ghost' || variant === 'danger'
  return (
    <GButton variant={glass ? 'glass' : 'filled'} destructive={variant === 'danger'}
      className={`${size === 'sm' ? 'bz-sm' : 'bz-cta'} ${className}`} {...props}>
      {children}
    </GButton>
  )
}

export function IconBtn({ children, onClick, label }) {
  return <GButton icon={children} aria-label={label} onClick={onClick} />
}

export function Wallpaper() {
  return <div aria-hidden="true" className="bz-wall absolute inset-0 -z-10 pointer-events-none" />
}

// Полноэкранная панель поверх приложения
export function Panel({ title, onClose, onBack, children, footer }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col anim-slide bg-paper">
      <header className="flex items-center gap-2 px-4 pt-[max(14px,env(safe-area-inset-top))] pb-3">
        {onBack ? <IconBtn onClick={onBack} label="Назад"><ChevronLeft /></IconBtn> : <span className="w-10" />}
        <h2 className="flex-1 text-center font-semibold text-[16px]">{title}</h2>
        {onClose ? <IconBtn onClick={onClose} label="Закрыть"><X /></IconBtn> : <span className="w-10" />}
      </header>
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">{children}</div>
      {footer && <div className="px-4 pt-2 pb-[max(16px,env(safe-area-inset-bottom))] flex flex-col gap-2">{footer}</div>}
    </div>
  )
}

export function Row({ label, value, strong, muted, hint }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <span className={`text-[14px] ${muted ? 'text-mute' : ''}`}>
        {label}
        {hint && <span className="block text-[12px] text-mute">{hint}</span>}
      </span>
      <span className={`num text-right ${strong ? 'font-semibold text-[16px]' : 'text-[14px]'}`}>{value}</span>
    </div>
  )
}

export function Card({ className = '', children, ...props }) {
  return <div className={`bz-card ${className}`} {...props}>{children}</div>
}

// Стеклянная кнопка-карточка для выбора варианта
export function Choice({ selected, onClick, children, className = '' }) {
  return (
    <div role="button" tabIndex={0} aria-pressed={selected} onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      className={`bz-card text-left cursor-pointer transition outline-offset-2 ${selected ? 'ring-2 ring-ink' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function Chip({ children, onClick }) {
  return <GButton className="bz-sm num" onClick={onClick}>{children}</GButton>
}

export function Label({ children, className = '' }) {
  return <div className={`text-[11px] uppercase tracking-[.08em] text-mute font-medium ${className}`}>{children}</div>
}

export function Notice({ tone = 'info', icon, title, children, action }) {
  const tones = {
    info: 'bg-card text-ink border border-line',
    warn: 'bg-warn/12 text-warn',
    error: 'bg-down/12 text-down',
    ok: 'bg-up/12 text-up',
  }
  return (
    <div role={tone === 'error' ? 'alert' : undefined} className={`rounded-2xl p-3.5 flex gap-3 ${tones[tone]}`}>
      {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
      <div className="flex-1 text-[13px] leading-snug">
        {title && <div className="font-semibold text-[14px] mb-0.5">{title}</div>}
        <div className="opacity-90">{children}</div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  )
}

export function Disclaimer({ children }) {
  return <p className="text-[11px] leading-snug text-mute mt-4">{children}</p>
}

export function Section({ title, children, action }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold text-[16px]">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Empty({ children }) {
  return <div className="bz-card text-center text-[14px] text-mute py-8">{children}</div>
}
