import { Toaster } from 'sonner'
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import CreateSession from './components/CreateSession'
import JoinSession from './components/JoinSession'
import PlanningPokerSession from './components/PlanningPokerSession'
import ThemeToggle from './components/ThemeToggle'
import { WebSocketProvider } from './components/websocket/WebSocketProvider'
import { useSession } from './contexts/SessionContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBolt, faHeart, faChartBar } from '@fortawesome/free-solid-svg-icons'
import './App.css'

// ── Protected session route — redirects to home if no session in context ─────
function ProtectedSession() {
  const { state, dispatch } = useSession()
  const navigate  = useNavigate()

  if (!state.session) return <Navigate to="/" replace />

  const handleLeave = () => {
    dispatch({ type: 'SESSION_LEFT' })
    navigate('/')
  }

  return (
    <WebSocketProvider sessionCode={state.session.sessionCode}>
      <PlanningPokerSession
        session={state.session}
        userName={state.userName}
        userId={state.userId}
        isModerator={state.isModerator}
        onLeave={handleLeave}
      />
    </WebSocketProvider>
  )
}

// ── Home page ─────────────────────────────────────────────────────────────────
function Home() {
  const navigate = useNavigate()

  return (
    <motion.div
      key="home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen flex flex-col items-center justify-center"
    >
      <div className="text-center mb-10 sm:mb-20 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-2xl mb-6 sm:mb-8">
          <FontAwesomeIcon icon={faBolt} className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">EstiMate</h1>
        <p className="text-base sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Simple, fast story estimation for agile teams
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-10 mb-8 sm:mb-16 px-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faBolt}     className="text-xl text-blue-600 dark:text-blue-400" />
          <span>Multiple Methods</span>
        </div>
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faBolt}     className="text-xl text-yellow-500 dark:text-yellow-400" />
          <span>Real-time</span>
        </div>
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faChartBar} className="text-xl text-purple-600 dark:text-purple-400" />
          <span>Analytics</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none px-6 sm:px-0">
        <button
          onClick={() => navigate('/create')}
          className="bg-blue-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:bg-blue-700 active:bg-blue-800 transition-colors w-full sm:w-auto text-center"
        >
          Create Session
        </button>
        <button
          onClick={() => navigate('/join')}
          className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 w-full sm:w-auto text-center"
        >
          Join Session
        </button>
      </div>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-16 text-center text-gray-500 dark:text-gray-400"
      >
        <p className="flex items-center justify-center space-x-1">
          <span>Made with</span>
          <FontAwesomeIcon icon={faHeart} className="w-4 h-4 text-red-500" />
          <span>for agile teams</span>
        </p>
      </motion.footer>
    </motion.div>
  )
}

// ── Create page ───────────────────────────────────────────────────────────────
function CreatePage() {
  const { dispatch } = useSession()
  const navigate = useNavigate()

  const handleSessionCreated = (newSession, moderatorName, moderatorId) => {
    dispatch({ type: 'SESSION_CREATED', payload: { session: newSession, userName: moderatorName, userId: moderatorId } })
    navigate(`/session/${newSession.sessionCode}`)
  }

  return (
    <motion.div
      key="create"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen flex items-center justify-center py-12"
    >
      <div className="w-full max-w-xl px-4 sm:px-8">
        <button
          onClick={() => navigate('/')}
          className="mb-4 sm:mb-8 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-medium"
        >
          ← Back
        </button>
        <CreateSession onSessionCreated={handleSessionCreated} />
      </div>
    </motion.div>
  )
}

// ── Join page ─────────────────────────────────────────────────────────────────
function JoinPage() {
  const { dispatch } = useSession()
  const navigate = useNavigate()

  const handleSessionJoined = (joinedSession, name) => {
    dispatch({ type: 'SESSION_JOINED', payload: { session: joinedSession.session, userName: name, userId: joinedSession.userId } })
    navigate(`/session/${joinedSession.session.sessionCode}`)
  }

  return (
    <motion.div
      key="join"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen flex items-center justify-center py-12"
    >
      <div className="w-full max-w-xl px-4 sm:px-8">
        <button
          onClick={() => navigate('/')}
          className="mb-4 sm:mb-8 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-medium"
        >
          ← Back
        </button>
        <JoinSession onSessionJoined={handleSessionJoined} />
      </div>
    </motion.div>
  )
}

// ── App shell ─────────────────────────────────────────────────────────────────
function App() {
  const location = useLocation()
  const isSessionPage = location.pathname.startsWith('/session/')

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {!isSessionPage && (
        <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
          <ThemeToggle />
        </div>
      )}
      <Toaster richColors position="top-right" />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/"                  element={<Home />} />
          <Route path="/create"            element={<CreatePage />} />
          <Route path="/join"              element={<JoinPage />} />
          <Route path="/session/:code"     element={<ProtectedSession />} />
          <Route path="*"                  element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default App
