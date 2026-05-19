import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/webflow-base.css'
import './styles/main/tokens.css'
import './styles/main/webflow-runtime.css'
import './styles/main/layout.css'
import './styles/main/base.css'
import './styles/main/nav.css'
import './styles/main/typography.css'
import './styles/main/hero.css'
import './styles/main/style-guide.css'
import './styles/main/buttons.css'
import './styles/main/forms.css'
import './styles/main/footer.css'
import './styles/main/spacing.css'
import './styles/main/cards.css'
import './styles/main/slider.css'
import './styles/main/icons.css'
import './styles/main/marquee.css'
import './styles/main/accordion.css'
import './styles/main/pricing.css'
import './styles/main/tags.css'
import './styles/main/tabs.css'
import './styles/main/interactions.css'
import './styles/main/progress.css'
import './styles/main/social-icons.css'
import './styles/main/tooltip.css'
import './styles/main/pages/home.css'
import './styles/main/pages/about.css'
import './styles/main/support.css'
import './styles/main/pages/games.css'
import './styles/main/grid-areas.css'
import './styles/mobile-menu.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
