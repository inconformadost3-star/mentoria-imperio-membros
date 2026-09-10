import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/quicksand/400.css'
import '@fontsource/quicksand/500.css'
import '@fontsource/quicksand/600.css'
import '@fontsource/quicksand/700.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Permite "Instalar app" no celular (Add to Home Screen). Não faz cache de
// nada, só existe pra o navegador considerar o site instalável.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
