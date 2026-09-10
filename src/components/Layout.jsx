import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'

export default function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--srd-bg)' }}>
      <Sidebar userName="Bia" />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
