import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sessionAPI, storyAPI } from '../utils/api';
import EstimationCards from './EstimationCards';
import StoryList from './StoryList';
import VotingResults from './VotingResults';
import ThemeToggle from './ThemeToggle';
import AnalyticsDashboard from './analytics/AnalyticsDashboard';
import SessionSettings from './session/SessionSettings';
import VotingTimer from './timer/VotingTimer';
import ExportModal from './export/ExportModal';
import ImportModal from './export/ImportModal';
import RealTimeNotifications from './websocket/RealTimeNotifications';
import UserPresence from './websocket/UserPresence';
import TutorialModal from './ux/TutorialModal';
import { useWebSocket } from './websocket/WebSocketProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faCopy, faGear, faRightFromBracket, faChartBar, faDownload, faUpload, faCircleQuestion, faBullseye, faFileLines, faChartLine } from '@fortawesome/free-solid-svg-icons';

const PlanningPokerSession = ({ session: initialSession, userName, userId, isModerator = false, onLeave }) => {
  const [session, setSession] = useState(initialSession);
  const [currentStory, setCurrentStory] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState(() => {
    // Load active tab from localStorage, default to 'estimate'
    return localStorage.getItem('planningPoker_activeTab') || 'estimate';
  });
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showCreateStoryForm, setShowCreateStoryForm] = useState(false);
  const [allStories, setAllStories] = useState([]);

  const { subscribe } = useWebSocket();

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('planningPoker_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    fetchUsers();
    fetchSessionDetails();
  }, [session.sessionCode]);

  // Subscribe to story activation updates
  useEffect(() => {
    if (!session?.sessionCode) return;

    const unsubscribe = subscribe(`/topic/session/${session.sessionCode}/story`, (message) => {
      try {
        const data = JSON.parse(message.body);
        if (data.type === 'STORY_ACTIVATED' && data.story) {
          setCurrentStory(data.story);
          setSession(prev => ({ ...prev, votesRevealed: false }));
        } else if (data.type === 'STORY_RESET' && data.story) {
          if (currentStory?.id === data.story.id) {
            setCurrentStory(data.story);
            setSession(prev => ({ ...prev, votesRevealed: false }));
          }
        } else if (data.type === 'STORY_FINALIZED' && data.story) {
          if (currentStory?.id === data.story.id) {
            setCurrentStory(data.story);
          }
        }
      } catch (error) {
        console.error('Error parsing story message:', error);
      }
    });

    return () => unsubscribe && unsubscribe();
  }, [session?.sessionCode, subscribe, currentStory?.id]);

  // Subscribe to reveal events to update session state
  useEffect(() => {
    if (!session?.sessionCode) return;

    const unsubscribe = subscribe(`/topic/session/${session.sessionCode}/reveal`, (message) => {
      try {
        const data = JSON.parse(message.body);
        if (data.type === 'VOTES_REVEALED') {
          setSession(prev => ({ ...prev, votesRevealed: true }));
        } else if (data.type === 'VOTES_RESET') {
          setSession(prev => ({ ...prev, votesRevealed: false }));
        }
      } catch (error) {
        console.error('Error parsing reveal message:', error);
      }
    });

    return () => unsubscribe && unsubscribe();
  }, [session?.sessionCode, subscribe]);

  useEffect(() => {
    if (!session?.sessionCode) return;

    const unsubscribe = subscribe(`/topic/session/${session.sessionCode}/users`, (message) => {
      try {
        const data = JSON.parse(message.body);
        if (data.type === 'USER_JOINED' || data.type === 'USER_LEFT') {
          fetchUsers();
        }
      } catch (error) {
        console.error('Error parsing user event message:', error);
      }
    });

    return () => unsubscribe && unsubscribe();
  }, [session?.sessionCode, subscribe]);

  useEffect(() => {
    if (!session?.sessionCode) return;

    const unsubscribe = subscribe(`/topic/session/${session.sessionCode}/timer`, (message) => {
      try {
        const data = JSON.parse(message.body);
        if (data.type === 'TIMER_SETTINGS_CHANGED') {
          setSession(prev => ({
            ...prev,
            timerEnabled: data.timerEnabled,
            timerDuration: data.timerDuration
          }));
        }
      } catch (error) {
        console.error('Error parsing timer message:', error);
      }
    });

    return () => unsubscribe && unsubscribe();
  }, [session?.sessionCode, subscribe]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      // N: Create Story (moderator only)
      if (e.key === 'n' && isModerator) {
        e.preventDefault();
        setShowCreateStoryForm(prev => !prev);
      }

      // R: Reveal Votes (moderator only, when story is active)
      if (e.key === 'r' && isModerator && currentStory && !session.votesRevealed) {
        e.preventDefault();
        handleRevealVotes();
      }

      // Arrow Left: Previous Story
      if (e.key === 'ArrowLeft' && allStories.length > 0) {
        e.preventDefault();
        navigateToPreviousStory();
      }

      // Arrow Right: Next Story
      if (e.key === 'ArrowRight' && allStories.length > 0) {
        e.preventDefault();
        navigateToNextStory();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModerator, currentStory, session.votesRevealed, allStories]);

  const handleRevealVotes = async () => {
    try {
      await sessionAPI.revealVotes(session.sessionCode);
      setSession(prev => ({ ...prev, votesRevealed: true }));
    } catch (error) {
      console.error('Error revealing votes:', error);
    }
  };

  const navigateToPreviousStory = () => {
    if (!currentStory || allStories.length === 0) return;
    const currentIndex = allStories.findIndex(s => s.id === currentStory.id);
    if (currentIndex > 0) {
      handleStorySelected(allStories[currentIndex - 1]);
    }
  };

  const navigateToNextStory = () => {
    if (!currentStory || allStories.length === 0) return;
    const currentIndex = allStories.findIndex(s => s.id === currentStory.id);
    if (currentIndex >= 0 && currentIndex < allStories.length - 1) {
      handleStorySelected(allStories[currentIndex + 1]);
    }
  };

  const fetchSessionDetails = async () => {
    try {
      const response = await sessionAPI.get(session.sessionCode);
      const sessionData = response.data;
      
      setSession(sessionData);
      
      if (sessionData.currentStoryId) {
        fetchCurrentStory(sessionData.currentStoryId);
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
    }
  };

  const fetchCurrentStory = async (storyId) => {
    try {
      const response = await storyAPI.get(session.sessionCode, storyId);
      setCurrentStory(response.data);
    } catch (error) {
      console.error('Error fetching current story:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await sessionAPI.getUsers(session.sessionCode);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleStorySelected = async (story) => {
    setCurrentStory(story);
    setSession(prev => ({ ...prev, votesRevealed: false }));
    try {
      await sessionAPI.setCurrentStory(session.sessionCode, story.id);
    } catch (error) {
      console.error('Error setting current story:', error);
    }
  };

  const handleVoteSubmitted = () => {
    fetchUsers();
  };

  const handleFinalizeEstimate = async (finalEstimate) => {
    if (!currentStory) return;
    
    try {
      await storyAPI.finalize(session.sessionCode, currentStory.id, finalEstimate, null);
      // Update current story with final estimate
      setCurrentStory(prev => ({
        ...prev,
        finalEstimate,
        status: 'COMPLETED'
      }));
    } catch (error) {
      console.error('Error finalizing estimate:', error);
      throw error;
    }
  };

  const copySessionCode = async () => {
    try {
      await navigator.clipboard.writeText(session.sessionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy session code:', error);
    }
  };

  const tabs = isModerator ? [
    { id: 'estimate', label: 'Estimate', icon: faBullseye },
    { id: 'stories', label: 'Stories', icon: faFileLines },
    { id: 'results', label: 'Results', icon: faChartBar },
    { id: 'analytics', label: 'Analytics', icon: faChartLine },
  ] : [];

  const handleSettingsSaved = async (updatedSession) => {
    // Update local session state with the new settings
    setSession(updatedSession);
    // Also refetch to ensure we have the latest data
    await fetchSessionDetails();
  };

  const handleTimerComplete = async () => {
    if (!currentStory) return;
    // Auto-reveal votes when timer completes
    try {
      await sessionAPI.revealVotes(session.sessionCode);
      // Update local session state to reflect votes are revealed
      setSession(prev => ({ ...prev, votesRevealed: true }));
    } catch (error) {
      console.error('Error revealing votes:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Real-time Notifications */}
      <RealTimeNotifications sessionCode={session.sessionCode} />

      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between h-24">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {session.name}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span>Code:</span>
                  <button
                    onClick={copySessionCode}
                    className="font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg flex items-center space-x-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span>{session.sessionCode}</span>
                    <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />
                  </button>
                  {copied && (
                    <span className="text-green-600 text-xs">
                      Copied!
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowTutorial(true)}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Tutorial"
                >
                  <FontAwesomeIcon icon={faCircleQuestion} className="w-5 h-5" />
                </button>
                
                {isModerator && (
                  <>
                    <button
                      onClick={() => setShowExport(true)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Export"
                    >
                      <FontAwesomeIcon icon={faDownload} className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => setShowImport(true)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Import"
                    >
                      <FontAwesomeIcon icon={faUpload} className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => setShowSettings(true)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Settings"
                    >
                      <FontAwesomeIcon icon={faGear} className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              
              {/* User Presence */}
              {isModerator && (
                <div className="mt-1">
                  <UserPresence sessionCode={session.sessionCode} currentUser={userName} users={users} session={session} />
                </div>
              )}
              
              <button
                onClick={onLeave}
                className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
                <span>Leave</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Current Story Display */}
      {currentStory && (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {currentStory.title}
                </h2>
                {currentStory.description && (
                  <p className="text-gray-500 dark:text-gray-400 text-lg max-w-3xl">
                    {currentStory.description}
                  </p>
                )}
              </div>
              
              {/* Voting Timer */}
              {session.timerEnabled && currentStory && (
                <div className="ml-4">
                  <VotingTimer
                    key={`timer-${currentStory.id}-${session.timerEnabled ? 'enabled' : 'disabled'}`}
                    duration={session.timerDuration || 300}
                    autoReveal={session.autoReveal || false}
                    autoStart={true}
                    onComplete={isModerator ? handleTimerComplete : undefined}
                    readOnly={!isModerator}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs (Moderator Only) */}
      {isModerator && (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-8">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-5 px-2 border-b-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <FontAwesomeIcon icon={tab.icon} className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {isModerator ? (
          /* Moderator: Tab-based navigation */
          <div key={activeTab}>
            {activeTab === 'estimate' && (
              <EstimationCards
                session={session}
                currentStory={currentStory}
                userName={userName}
                userId={userId}
                isModerator={isModerator}
                onVoteSubmitted={handleVoteSubmitted}
              />
            )}
            
            {activeTab === 'stories' && (
              <StoryList
                session={{
                  ...session,
                  onStoriesUpdate: setAllStories
                }}
                onStorySelected={handleStorySelected}
                currentStory={currentStory}
                userName={userName}
                isModerator={isModerator}
                showCreateForm={showCreateStoryForm}
                onToggleCreateForm={() => setShowCreateStoryForm(prev => !prev)}
              />
            )}
            
            {activeTab === 'results' && (
              <VotingResults
                session={session}
                currentStory={currentStory}
                onFinalizeEstimate={handleFinalizeEstimate}
                isModerator={isModerator}
              />
            )}
          
            {activeTab === 'analytics' && (
              <AnalyticsDashboard 
                sessionCode={session.sessionCode}
                currentStoryId={currentStory?.id}
              />
            )}
          </div>
        ) : (
          /* Participant: Controlled by moderator's actions */
          <div>
            {!currentStory ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">⏳</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Waiting for Host
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  The host will activate a story for voting shortly.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <EstimationCards
                  session={session}
                  currentStory={currentStory}
                  userName={userName}
                  userId={userId}
                  isModerator={isModerator}
                  onVoteSubmitted={handleVoteSubmitted}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {showSettings && (
        <SessionSettings
          session={session}
          onUpdate={handleSettingsSaved}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showExport && (
        <ExportModal
          isOpen={true}
          sessionCode={session.sessionCode}
          sessionName={session.name}
          onClose={() => setShowExport(false)}
        />
      )}

      {showImport && (
        <ImportModal
          isOpen={true}
          sessionCode={session.sessionCode}
          onClose={() => setShowImport(false)}
          onImportSuccess={(importedCount) => {
            fetchSessionDetails();
            setShowImport(false);
          }}
        />
      )}

      <TutorialModal 
        isOpen={showTutorial} 
        onClose={() => setShowTutorial(false)} 
      />
    </div>
  );
};

export default PlanningPokerSession;
