import { useState, useEffect } from 'react'

export const useTheme = () => {
  const [theme, setTheme] = useState('light')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Get saved theme from localStorage or default to 'light'
    const savedTheme = localStorage.getItem('theme') || 'light'
    // Only allow 'light' or 'dark', fallback to 'light' for any other value
    const validTheme = savedTheme === 'dark' ? 'dark' : 'light'
    setTheme(validTheme)
    applyTheme(validTheme)
  }, [])

  const applyTheme = (theme) => {
    const html = document.documentElement
    
    if (theme === 'dark') {
      html.classList.add('dark')
      setIsDark(true)
    } else {
      html.classList.remove('dark')
      setIsDark(false)
    }
  }

  const changeTheme = (newTheme) => {
    // Only allow 'light' or 'dark'
    const validTheme = newTheme === 'dark' ? 'dark' : 'light'
    setTheme(validTheme)
    localStorage.setItem('theme', validTheme)
    applyTheme(validTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    changeTheme(newTheme)
  }

  return {
    theme,
    changeTheme,
    toggleTheme,
    isDark
  }
}
