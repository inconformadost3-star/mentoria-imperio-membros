import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthProvider.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Comunidade from './pages/Comunidade.jsx'
import Aulas from './pages/Aulas.jsx'
import Suporte from './pages/Suporte.jsx'
import Ajustes from './pages/Ajustes.jsx'
import Admin from './pages/Admin.jsx'
import ResetSenha from './pages/ResetSenha.jsx'

// Protege as rotas da área de membros. Se o Supabase não estiver
// configurado (.env vazio), deixa passar direto em "modo demonstração" com
// dados de exemplo — só exige login de verdade quando há backend real.
function RequireAuth({ children }) {
  const { configured, session, loading } = useAuth()

  if (!configured) return children
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a89f92' }}>
        Carregando…
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return children
}

// Só deixa entrar em /admin quem tem profiles.is_admin = true. Em modo
// demonstração (sem Supabase) deixa passar, já que não há como checar nada.
function RequireAdmin({ children }) {
  const { configured, isAdmin, loading } = useAuth()
  if (!configured) return children
  if (loading) return null
  if (!isAdmin) return <Navigate to="/comunidade" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-senha" element={<ResetSenha />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/comunidade" replace />} />
        <Route path="/comunidade" element={<Comunidade />} />
        <Route path="/aulas" element={<Aulas />} />
        <Route path="/suporte" element={<Suporte />} />
        <Route path="/ajustes" element={<Ajustes />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<Navigate to="/comunidade" replace />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
