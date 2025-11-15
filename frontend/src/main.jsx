import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Initialize theme before rendering
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'light'
  // Only allow 'light' or 'dark', fallback to 'light' for any other value
  const validTheme = savedTheme === 'dark' ? 'dark' : 'light'
  const html = document.documentElement
  
  if (validTheme === 'dark') {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}

initializeTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
