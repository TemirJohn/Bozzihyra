import { useState } from 'react'
import { TabBar } from 'glisse'
import { Home as HomeIcon, Coins, CreditCard, Link2, User } from 'lucide-react'
import { useStore } from './store.jsx'
import { Wallpaper } from './components/ui.jsx'
import Onboarding from './screens/Onboarding.jsx'
import Home from './screens/Home.jsx'
import Gold from './screens/Gold.jsx'
import Card from './screens/Card.jsx'
import Partners from './screens/Partners.jsx'
import Profile from './screens/Profile.jsx'
import Trade from './screens/Trade.jsx'
import TopUp from './screens/TopUp.jsx'
import Cashback from './screens/Cashback.jsx'

const TABS = [
  { value: 'home', label: 'Главная', icon: <HomeIcon /> },
  { value: 'gold', label: 'Золото', icon: <Coins /> },
  { value: 'card', label: 'Карта', icon: <CreditCard /> },
  { value: 'partners', label: 'Биржи', icon: <Link2 /> },
  { value: 'profile', label: 'Профиль', icon: <User /> },
]

const SCREENS = { home: Home, gold: Gold, card: Card, partners: Partners, profile: Profile }

export default function App() {
  const { state } = useStore()
  const [tab, setTab] = useState('home')
  const [modal, setModal] = useState(null) // { type, ...props }

  const nav = {
    tab: setTab,
    open: (type, props = {}) => setModal({ type, ...props }),
    close: () => setModal(null),
  }

  const Screen = SCREENS[tab]

  return (
    <div className="h-full w-full flex items-center justify-center sm:p-6 bz-wall">
      <div id="phone" className="relative isolate h-full w-full overflow-hidden sm:h-[844px] sm:max-h-full sm:w-[390px] sm:rounded-[48px] sm:shadow-[0_30px_80px_-20px_rgba(0,0,0,.45)] sm:ring-[10px] sm:ring-[#0b0d10] flex flex-col">
        <Wallpaper />
        {!state.onboarded ? (
          <Onboarding />
        ) : (
          <>
            <main key={tab} className="flex-1 overflow-y-auto no-scrollbar anim-rise pb-28">
              <Screen nav={nav} />
            </main>
            <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center pb-[max(14px,env(safe-area-inset-bottom))] pointer-events-none">
              <TabBar className="bz-tabs pointer-events-auto" aria-label="Разделы" items={TABS} value={tab} onValueChange={setTab} />
            </div>
            {modal?.type === 'trade' && <Trade mode={modal.mode} nav={nav} />}
            {modal?.type === 'topup' && <TopUp nav={nav} />}
            {modal?.type === 'cashback' && <Cashback nav={nav} />}
          </>
        )}
      </div>
    </div>
  )
}
