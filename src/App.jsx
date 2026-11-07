import { useEffect, useRef, useState } from 'react'
import { TabBar, Glass } from 'glisse'
import { Home as HomeIcon, Coins, CreditCard, Link2, User } from 'lucide-react'
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

const TABS = [
  { value: 'home', label: 'Главная', icon: <HomeIcon /> },
  { value: 'gold', label: 'Золото', icon: <Coins /> },
  { value: 'card', label: 'Карта', icon: <CreditCard /> },
  { value: 'partners', label: 'Биржи', icon: <Link2 /> },
  { value: 'profile', label: 'Профиль', icon: <User /> },
]

const SCREENS = { home: Home, gold: Gold, card: Card, partners: Partners, profile: Profile }
const MODALS = { trade: Trade, topup: TopUp, cashback: Cashback, asset: AssetPanel, notifications: Notifications, history: History, portfolio: Portfolio, jury: Jury }

const juryFromUrl = () => {
  try { return new URLSearchParams(location.search).get('jury') === '1' } catch { return false }
}

export default function App() {
  const { state } = useStore()
  const [tab, setTab] = useState('home')
  const [modal, setModal] = useState(() => (juryFromUrl() ? { type: 'jury' } : null))
  const [banner, setBanner] = useState(null)

  const nav = {
    tab: (t) => { setModal(null); setTab(t) },
    open: (type, props = {}) => setModal({ type, ...props }),
    close: () => setModal(null),
  }

  // Всплывающий баннер для каждого нового уведомления (если push включены)
  const lastId = useRef(state.notifications[0]?.id)
  useEffect(() => {
    const top = state.notifications[0]
    if (!top || top.id === lastId.current) return
    lastId.current = top.id
    if (!state.settings.push || modal?.type === 'notifications') return
    setBanner(top)
    const id = setTimeout(() => setBanner(null), 4000)
    return () => clearTimeout(id)
  }, [state.notifications, state.settings.push, modal])

  const Screen = SCREENS[tab]
  const Modal = modal && MODALS[modal.type]
  const BannerIcon = banner && (NOTE_ICON[banner.kind] || NOTE_ICON.info)

  return (
    <div className="h-full w-full flex items-center justify-center sm:p-6 bz-wall">
      <div id="phone" className="relative isolate h-full w-full overflow-hidden bg-paper sm:h-[844px] sm:max-h-full sm:w-[390px] sm:rounded-[48px] sm:shadow-[0_30px_80px_-20px_rgba(0,0,0,.45)] sm:ring-[10px] sm:ring-[#0b0d10] flex flex-col">
        {!state.onboarded ? (
          <Onboarding />
        ) : (
          <>
            <main key={tab} className="flex-1 overflow-y-auto no-scrollbar anim-rise pb-28">
              <Screen nav={nav} />
            </main>
            <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center pb-[max(14px,env(safe-area-inset-bottom))] pointer-events-none">
              <TabBar className="bz-tabs pointer-events-auto" aria-label="Разделы" items={TABS} value={tab} onValueChange={nav.tab} />
            </div>
            {Modal && <Modal key={modal.type + (modal.asset || modal.id || '') + (modal.mode || '')} {...modal} nav={nav} />}
          </>
        )}

        {banner && (
          <div className="absolute inset-x-3 top-[max(10px,env(safe-area-inset-top))] z-50 anim-rise" role="status">
            <Glass className="bz-glass-strong rounded-[22px] cursor-pointer" onClick={() => { setBanner(null); nav.open('notifications') }}>
              <div className="flex gap-3 items-center p-3">
                <span className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${BannerIcon.cls}`}><BannerIcon.icon size={16} /></span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{banner.title}</div>
                  <div className="text-[12px] text-mute truncate">{banner.text}</div>
                </div>
                <span className="text-[11px] text-mute shrink-0">сейчас</span>
              </div>
            </Glass>
          </div>
        )}
      </div>
    </div>
  )
}
