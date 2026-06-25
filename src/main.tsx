import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const umamiScriptUrl = import.meta.env.VITE_UMAMI_SCRIPT_URL
const umamiWebsiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID

if (umamiScriptUrl && umamiWebsiteId) {
  const script = document.createElement('script')
  script.defer = true
  script.src = umamiScriptUrl
  script.dataset.websiteId = umamiWebsiteId

  const domains = import.meta.env.VITE_UMAMI_DOMAINS
  if (domains) script.dataset.domains = domains

  document.head.appendChild(script)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
