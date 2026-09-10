import { Outlet } from 'react-router-dom'
import Sidebar, { MobileTopBar, MobileBottomNav } from './Sidebar.jsx'

export default function Layout() {
  return (
    <div className="srd-app-shell">
      <Sidebar userName="Bia" />
      <div className="srd-app-main-wrap">
        <MobileTopBar />
        <main className="srd-app-main">
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
    </div>
  )
}
