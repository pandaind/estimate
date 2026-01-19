import React from 'react'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons'
import { useTheme } from '../hooks/useTheme'

const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-3 bg-white/10 dark:bg-gray-800/10 backdrop-blur-md rounded-lg border border-white/20 dark:border-gray-700/20 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        key={isDark ? 'dark' : 'light'}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-5 h-5"
      >
        {isDark ? (
          <FontAwesomeIcon icon={faSun} className="w-5 h-5 text-yellow-400" />
        ) : (
          <FontAwesomeIcon icon={faMoon} className="w-5 h-5 text-indigo-400" />
        )}
      </motion.div>
    </motion.button>
  )
}

export default ThemeToggle
