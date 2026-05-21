import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './styles/webflow-base.css'
import './styles/main/tokens.css'
import './styles/main/layout.css'
import './styles/main/base.css'
import './styles/main/nav.css'
import './styles/main/typography.css'
import './styles/main/buttons.css'
import './styles/main/footer.css'
import './styles/main/tags.css'
import './styles/main/social-icons.css'
import './styles/main/pages/home.css'
import './styles/main/pages/about.css'
import './styles/main/support.css'
import './styles/main/pages/games.css'
import './styles/mobile-menu.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
