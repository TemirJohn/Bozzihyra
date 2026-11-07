import { useEffect, useRef, useState } from 'react'
import { TabBar, Glass } from 'glisse'
import { Home as HomeIcon, Coins, CreditCard, Link2, User, X } from 'lucide-react'
import { useStore } from './store.jsx'
import Onboarding from './screens/Onboarding.jsx'
import Home from './screens/Home.jsx'
import Gold from './screens/Gold.jsx'
import Card from './screens/Card.jsx'
import Partners from './screens/Partners.jsx'
import Profile from './screens/Profile.jsx'
import Trade from './screens/Trade.jsx'
import TopUp from './screens/TopUp.jsx'
import Cashback from './screens/Cashback.jsx'
import AssetPanel from './screens/AssetPanel.jsx'
import Notifications, { NOTE_ICON } from './screens/Notifications.jsx'
import History from './screens/History.jsx'
import Portfolio from './screens/Portfolio.jsx'
import Jury from './screens/Jury.jsx'
import Receipt from './screens/Receipt.jsx'
import Assistant from './screens/Assistant.jsx'
import { CardPage, FreezePage, OnlinePage, LimitsPage } from './screens/CardControls.jsx'
import { SecurityPage, DocumentsPage, TaxesPage } from './screens/ProfilePages.jsx'
import { LockScreen } from './components/Security.jsx'
import { q } from './lib/shot.js'
import Guest, { SignupPrompt } from './screens/Guest.jsx'

const TABS = [
  { value: 'home', label: 'Главная', icon: <HomeIcon /> },
  { value: 'gold', label: 'Золото', icon: <Coins /> },
  { value: 'card', label: 'Карта', icon: <CreditCard /> },
  { value: 'partners', label: 'Биржи', icon: <Link2 /> },
  { value: 'profile', label: 'Профиль', icon: <User /> },
]

const SCREENS = { home: Home, gold: Gold, card: Card, partners: Partners, profile: Profile }
const MODALS = {
  trade: Trade, topup: TopUp, cashback: Cashback, asset: AssetPanel, notifications: Notifications,
  history: History, portfolio: Portfolio, jury: Jury, receipt: Receipt,
  cardPage: CardPage, freeze: FreezePage, online: OnlinePage, limits: LimitsPage,
  security: SecurityPage, documents: DocumentsPage, taxes: TaxesPage, assistant: Assistant, signupPrompt: SignupPrompt,
}

const urlFlag = (name) => {
  try { return new URLSearchParams(location.search).get(name) === '1' } catch { return false }
}

export default function App() {
  const { state, dispatch } = useStore()
  const [tab, setTab] = useState(() => q('tab') || 'home')
  const [modal, setModal] = useState(() => {
    if (urlFlag('jury')) return { type: 'jury' }
    const type = q('open')
    if (!type) return null
    const id = q('id') === 'first' ? state.txs[0]?.id : q('id') === 'firstpay' ? state.txs.find((t) => t.kind === 'pay')?.id : q('id')
    return { type, id, asset: q('asset') || undefined, mode: q('mode') || undefined, filter: q('filter') || undefined, ask: q('ask') || undefined, autoQuote: q('autoQuote') === '1' }
  })
  // Экран входа при открытии (кроме режима жюри, чтобы сразу показывать метрики)
  const [locked, setLocked] = useState(() => state.onboarded && !urlFlag('jury') && q('nolock') !== '1')
  const [banner, setBanner] = useState(null)
  const [signingUp, setSigningUp] = useState(false)

  const nav = {
    tab: (t) => { setModal(null); setTab(t) },
    open: (type, props = {}) => setModal({ type, ...props }),
    close: () => setModal(null),
    lock: () => setLocked(true),
    signup: () => { setModal(null); setSigningUp(true); dispatch({ type: 'track', name: 'guest_signup_start' }) },
  }

  // Новое уведомление → баннер (если push включены и центр уведомлений не открыт)
  const lastId = useRef(state.notifications[0]?.id)
  useEffect(() => {
    const top = state.notifications[0]
    if (!top || top.id === lastId.current) return
    lastId.current = top.id
    if (state.settings.push && modal?.type !== 'notifications') setBanner(top)
  }, [state.notifications, state.settings.push, modal])

  // Таймер скрытия привязан к самому баннеру: каждый новый баннер живёт 4 секунды
  useEffect(() => {
    if (!banner) return
    const id = setTimeout(() => setBanner(null), 4000)
    return () => clearTimeout(id)
  }, [banner])

  // Свайп вверх закрывает баннер
  const swipe = useRef(null)
  const onDown = (e) => { swipe.current = e.clientY }
  const onUp = (e) => {
    if (swipe.current != null && e.clientY - swipe.current < -25) setBanner(null)
    swipe.current = null
  }

  const Screen = SCREENS[tab]
  const Modal = modal && MODALS[modal.type]
  const BannerIcon = banner && (NOTE_ICON[banner.kind] || NOTE_ICON.info)
  const modalKey = modal && [modal.type, modal.id, modal.asset, modal.mode, modal.filter].filter(Boolean).join(':')

  return (
    <div className="h-full w-full flex items-center justify-center sm:p-6 bz-wall">
      <div id="phone" className="relative isolate h-full w-full overflow-hidden bg-paper sm:h-[844px] sm:max-h-full sm:w-[390px] sm:rounded-[48px] sm:shadow-[0_30px_80px_-20px_rgba(0,0,0,.35)] sm:ring-[10px] sm:ring-[#0a0a0a] flex flex-col">
        {!state.onboarded && state.guest && !signingUp ? (
          <>
            <main className="flex-1 overflow-y-auto no-scrollbar anim-rise"><Guest nav={nav} /></main>
            {Modal && <Modal key={modalKey} {...modal} nav={nav} />}
          </>
        ) : !state.onboarded ? (
          <Onboarding start={signingUp ? 't0' : (q('ob') || 'welcome')} onGuest={() => setSigningUp(false)} />
        ) : (
          <>
            <main key={tab} className="flex-1 overflow-y-auto no-scrollbar anim-rise pb-28">
              <Screen nav={nav} />
            </main>
            <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center pb-[max(14px,env(safe-area-inset-bottom))] pointer-events-none">
              <TabBar className="bz-tabs pointer-events-auto" aria-label="Разделы" items={TABS} value={tab} onValueChange={nav.tab} />
            </div>
            {Modal && <Modal key={modalKey} {...modal} nav={nav} />}
          </>
        )}

        {banner && !locked && (
          <div className="absolute inset-x-3 top-[max(10px,env(safe-area-inset-top))] z-50 anim-rise touch-none" role="status"
            onPointerDown={onDown} onPointerUp={onUp}>
            <Glass className="bz-glass-strong rounded-[22px]">
              <div className="flex gap-3 items-center p-3">
                <button className="flex gap-3 items-center flex-1 min-w-0 text-left" onClick={() => { setBanner(null); nav.open('notifications') }}>
                  <span className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${BannerIcon.cls}`}><BannerIcon.icon size={16} /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold truncate">{banner.title}</span>
                    <span className="block text-[12px] text-mute truncate">{banner.text}</span>
                  </span>
                </button>
                <button onClick={() => setBanner(null)} aria-label="Закрыть уведомление"
                  className="w-8 h-8 rounded-full grid place-items-center bg-ink/8 shrink-0"><X size={15} /></button>
              </div>
            </Glass>
          </div>
        )}

        {locked && state.onboarded && <LockScreen onUnlock={() => setLocked(false)} />}
      </div>
    </div>
  )
}
