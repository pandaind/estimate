import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { sessionAPI, storyAPI } from '../utils/api';
import { parseError } from '../utils/errorHandler';
import { STORAGE_KEYS } from '../utils/constants';
import { useSessionWebSocket } from '../hooks/useSessionWebSocket';

import SessionHeader from './session/SessionHeader';
import SessionTabs from './session/SessionTabs';
import CurrentStoryBanner from './session/CurrentStoryBanner';
import ModeratorView from './session/ModeratorView';
import ParticipantView from './session/ParticipantView';
import SessionSettings from './session/SessionSettings';
import ExportModal from './export/ExportModal';
import ImportModal from './export/ImportModal';
import RealTimeNotifications from './websocket/RealTimeNotifications';
import TutorialModal from './ux/TutorialModal';

const PlanningPokerSession = ({
  session: initialSession,
  userName,
  userId,
  isModerator = false,
  onLeave,
}) => {
  // ── session state ────────────────────────────────────────────────────────
  const [session, setSession]           = useState(initialSession);
  const [currentStory, setCurrentStory] = useState(null);
  const [users, setUsers]               = useState([]);
  const [allStories, setAllStories]     = useState([]);
  const [voteVersion, setVoteVersion]   = useState(0);

  // ── tab state (persisted) ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) || 'estimate',
  );
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
  }, [activeTab]);

  // ── modal state ───────────────────────────────────────────────────────────
  const [showSettings,        setShowSettings]        = useState(false);
  const [showExport,          setShowExport]          = useState(false);
  const [showImport,          setShowImport]          = useState(false);
  const [showTutorial,        setShowTutorial]        = useState(false);
  const [showCreateStoryForm, setShowCreateStoryForm] = useState(false);

  // ── data fetchers ─────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      const res = await sessionAPI.getUsers(session.sessionCode);
      setUsers(res.data);
    } catch (error) {
      toast.error(parseError(error).message);
    }
  }, [session.sessionCode]);

  const fetchCurrentStory = useCallback(async (storyId) => {
    try {
      const res = await storyAPI.get(session.sessionCode, storyId);
      setCurrentStory(res.data);
    } catch (error) {
      toast.error(parseError(error).message);
    }
  }, [session.sessionCode]);

  const fetchSessionDetails = useCallback(async () => {
    try {
      const res = await sessionAPI.get(session.sessionCode);
      setSession(res.data);
      if (res.data.currentStoryId) fetchCurrentStory(res.data.currentStoryId);
    } catch (error) {
      toast.error(parseError(error).message);
    }
  }, [session.sessionCode, fetchCurrentStory]);

  // Initial load
  useEffect(() => {
    fetchUsers();
    fetchSessionDetails();
  }, [session.sessionCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── WebSocket subscriptions (consolidated via hook) ───────────────────────
  useSessionWebSocket({
    sessionCode: session?.sessionCode,
    onStoryChange: (data) => {
      if (data.type === 'STORY_ACTIVATED' && data.story) {
        setCurrentStory(data.story);
        setSession((prev) => ({ ...prev, votesRevealed: false }));
      } else if (data.type === 'STORY_RESET' && data.story) {
        if (currentStory?.id === data.story.id) {
          setCurrentStory(data.story);
          setSession((prev) => ({ ...prev, votesRevealed: false }));
        }
      } else if (data.type === 'STORY_FINALIZED' && data.story) {
        if (currentStory?.id === data.story.id) setCurrentStory(data.story);
      }
    },
    onReveal: (data) => {
      if (data.type === 'VOTES_REVEALED') setSession((prev) => ({ ...prev, votesRevealed: true }));
      else if (data.type === 'VOTES_RESET')    setSession((prev) => ({ ...prev, votesRevealed: false }));
    },
    onUserChange: (data) => {
      if (data.type === 'USER_JOINED' || data.type === 'USER_LEFT') fetchUsers();
    },
    onTimerSettings: (data) => {
      if (data.type === 'TIMER_SETTINGS_CHANGED') {
        setSession((prev) => ({ ...prev, timerEnabled: data.timerEnabled, timerDuration: data.timerDuration }));
      }
    },
    onVoteChange: (data) => {
      if (data.type === 'VOTE_CAST') setVoteVersion((v) => v + 1);
    },
  });

  // ── action handlers ───────────────────────────────────────────────────────
  const handleRevealVotes = useCallback(async () => {
    try {
      await sessionAPI.revealVotes(session.sessionCode);
      setSession((prev) => ({ ...prev, votesRevealed: true }));
    } catch (error) {
      toast.error(parseError(error).message);
    }
  }, [session.sessionCode]);

  const handleStorySelected = useCallback(async (story) => {
    setCurrentStory(story);
    setSession((prev) => ({ ...prev, votesRevealed: false }));
    try {
      await sessionAPI.setCurrentStory(session.sessionCode, story.id);
    } catch (error) {
      toast.error(parseError(error).message);
    }
  }, [session.sessionCode]);

  const handleFinalizeEstimate = useCallback(async (finalEstimate) => {
    if (!currentStory) return;
    try {
      await storyAPI.finalize(session.sessionCode, currentStory.id, finalEstimate, null);
      setCurrentStory((prev) => ({ ...prev, finalEstimate, status: 'COMPLETED' }));
    } catch (error) {
      toast.error(parseError(error).message);
      throw error;
    }
  }, [session.sessionCode, currentStory]);

  const handleSettingsSaved = useCallback(async (updatedSession) => {
    setSession(updatedSession);
    await fetchSessionDetails();
  }, [fetchSessionDetails]);

  const handleTimerComplete = useCallback(async () => {
    if (!currentStory) return;
    try {
      await sessionAPI.revealVotes(session.sessionCode);
      setSession((prev) => ({ ...prev, votesRevealed: true }));
    } catch (error) {
      toast.error(parseError(error).message);
    }
  }, [session.sessionCode, currentStory]);

  // Story navigation helpers
  const navigateToPreviousStory = useCallback(() => {
    if (!currentStory || allStories.length === 0) return;
    const idx = allStories.findIndex((s) => s.id === currentStory.id);
    if (idx > 0) handleStorySelected(allStories[idx - 1]);
  }, [currentStory, allStories, handleStorySelected]);

  const navigateToNextStory = useCallback(() => {
    if (!currentStory || allStories.length === 0) return;
    const idx = allStories.findIndex((s) => s.id === currentStory.id);
    if (idx >= 0 && idx < allStories.length - 1) handleStorySelected(allStories[idx + 1]);
  }, [currentStory, allStories, handleStorySelected]);

  // ── keyboard shortcuts (deps fixed via useCallback) ───────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'n' && isModerator)                                           { e.preventDefault(); setShowCreateStoryForm((p) => !p); }
      if (e.key === 'r' && isModerator && currentStory && !session.votesRevealed) { e.preventDefault(); handleRevealVotes(); }
      if (e.key === 'ArrowLeft'  && allStories.length > 0)                        { e.preventDefault(); navigateToPreviousStory(); }
      if (e.key === 'ArrowRight' && allStories.length > 0)                        { e.preventDefault(); navigateToNextStory(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModerator, currentStory, session.votesRevealed, allStories, handleRevealVotes, navigateToPreviousStory, navigateToNextStory]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <RealTimeNotifications sessionCode={session.sessionCode} />

      <SessionHeader
        session={session}
        userName={userName}
        users={users}
        isModerator={isModerator}
        onLeave={onLeave}
        onShowSettings={() => setShowSettings(true)}
        onShowExport={() => setShowExport(true)}
        onShowImport={() => setShowImport(true)}
        onShowTutorial={() => setShowTutorial(true)}
      />

      <CurrentStoryBanner
        currentStory={currentStory}
        session={session}
        isModerator={isModerator}
        onTimerComplete={handleTimerComplete}
      />

      {isModerator && (
        <SessionTabs activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      <main className="max-w-7xl mx-auto px-8 py-12">
        {isModerator ? (
          <ModeratorView
            activeTab={activeTab}
            session={session}
            currentStory={currentStory}
            userName={userName}
            userId={userId}
            onVoteSubmitted={() => { fetchUsers(); setVoteVersion((v) => v + 1); }}
            onStorySelected={handleStorySelected}
            onStoriesUpdate={setAllStories}
            voteVersion={voteVersion}
            showCreateStoryForm={showCreateStoryForm}
            onToggleCreateStoryForm={() => setShowCreateStoryForm((p) => !p)}
            onFinalizeEstimate={handleFinalizeEstimate}
          />
        ) : (
          <ParticipantView
            session={session}
            currentStory={currentStory}
            userName={userName}
            userId={userId}
            onVoteSubmitted={fetchUsers}
          />
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
          isOpen
          sessionCode={session.sessionCode}
          sessionName={session.name}
          onClose={() => setShowExport(false)}
        />
      )}
      {showImport && (
        <ImportModal
          isOpen
          sessionCode={session.sessionCode}
          onClose={() => setShowImport(false)}
          onImportSuccess={() => { fetchSessionDetails(); setShowImport(false); }}
        />
      )}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
};

export default PlanningPokerSession;
