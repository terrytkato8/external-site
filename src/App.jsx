import { Routes, Route, useLocation } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Analytics from './components/Analytics'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import AboutPage from './pages/AboutPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  const location = useLocation()
  const isGamePage = location.pathname.startsWith('/games/')
  const bodyClass = isGamePage ? 'body-2' : 'body'

  return (
    <div className={bodyClass}>
      <ScrollToTop />
      <Analytics />
      <Nav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/games/:slug" element={<GamePage />} />
        <Route path="/about-us" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </div>
  )
}
