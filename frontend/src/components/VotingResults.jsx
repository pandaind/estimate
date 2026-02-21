import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { voteAPI, sessionAPI } from '../utils/api';
import { getCardColor } from '../utils/constants';
import { toast } from 'sonner';
import { parseError } from '../utils/errorHandler';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faChartBar, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useWebSocket } from './websocket/WebSocketProvider';

// Helper function to get user initials
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const VotingResults = ({ session, currentStory, onFinalizeEstimate, isModerator = false }) => {
  const [votes, setVotes] = useState([]);
  const [showVotes, setShowVotes] = useState(false);
  const [selectedFinalEstimate, setSelectedFinalEstimate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    if (currentStory) {
      fetchVotes();
      setShowVotes(session?.votesRevealed || currentStory?.finalEstimate ? true : false);
      setSelectedFinalEstimate('');
    }
  }, [currentStory?.id, session?.votesRevealed, currentStory?.finalEstimate]);

  // Subscribe to reveal events via WebSocket
  useEffect(() => {
    if (!session?.sessionCode) return;

    const unsubscribeReveal = subscribe(`/topic/session/${session.sessionCode}/reveal`, (message) => {
      try {
        const data = JSON.parse(message.body);
        if (data.type === 'VOTES_REVEALED' || data.storyId === currentStory?.id) {
          setShowVotes(true);
          fetchVotes();
        }
      } catch (error) {
        toast.error('Failed to process server message.');
      }
    });
    
    // Subscribe to story updates to handle resets and finalization
    const unsubscribeStory = subscribe(`/topic/session/${session.sessionCode}/story`, (message) => {
      try {
        const data = JSON.parse(message.body);
        if (data.type === 'STORY_RESET' && data.story && data.story.id === currentStory?.id) {
          // Story was reset, clear votes display
          setShowVotes(false);
          setVotes([]);
          setSelectedFinalEstimate('');
          fetchVotes();
        } else if (data.type === 'STORY_FINALIZED' && data.story && data.story.id === currentStory?.id) {
          // Story was finalized, show votes
          setShowVotes(true);
          fetchVotes();
        }
      } catch (error) {
        toast.error('Failed to process server message.');
      }
    });

    return () => {
      unsubscribeReveal && unsubscribeReveal();
      unsubscribeStory && unsubscribeStory();
    };
  }, [session?.sessionCode, currentStory?.id, subscribe]);

  const fetchVotes = async () => {
    if (!currentStory) return;
    
    try {
      const response = await voteAPI.get(session.sessionCode, currentStory.id);
      setVotes(response.data);
    } catch (error) {
      toast.error(parseError(error).message);
    }
  };

  const handleRevealToggle = async () => {
    if (showVotes) return; // Already revealed, do nothing
    
    // Revealing votes - call backend API
    setIsLoading(true);
    try {
      await sessionAPI.revealVotes(session.sessionCode);
      setShowVotes(true);
      await fetchVotes();
    } catch (error) {
      toast.error(parseError(error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizeEstimate = async () => {
    if (!selectedFinalEstimate) return;
    
    setIsLoading(true);
    try {
      await onFinalizeEstimate(selectedFinalEstimate);
      setSelectedFinalEstimate('');
    } catch (error) {
      toast.error(parseError(error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentStory) {
    return (
      <div className="card text-center">
        <div className="text-6xl mb-4">🤔</div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No story selected</h3>
        <p className="text-gray-500 dark:text-gray-400">Select a story to see voting results</p>
      </div>
    );
  }

  const voteCounts = votes.reduce((acc, vote) => {
    acc[vote.estimate] = (acc[vote.estimate] || 0) + 1;
    return acc;
  }, {});

  const uniqueEstimates = Object.keys(voteCounts);
  const hasConsensus = uniqueEstimates.length === 1 && votes.length > 1;
  const averageConfidence = votes.length > 0 
    ? (votes.reduce((sum, vote) => sum + (vote.confidence || 3), 0) / votes.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-8">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Voting Results</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {votes.length} vote{votes.length !== 1 ? 's' : ''}
            </span>
            {isModerator && !showVotes && !currentStory.finalEstimate && (
              <motion.button
                onClick={handleRevealToggle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary flex items-center space-x-2"
                disabled={isLoading || showVotes}
              >
                <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                <span>{isLoading ? 'Revealing...' : 'Reveal'}</span>
              </motion.button>
            )}
            {isModerator && (showVotes || currentStory.finalEstimate) && (
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4" />
                <span className="text-sm font-medium">{currentStory.finalEstimate ? 'Finalized' : 'Revealed'}</span>
              </div>
            )}
          </div>
        </div>

        {showVotes || currentStory.finalEstimate ? (
          <div className="space-y-4">
            {/* Individual votes */}
            <div className="grid grid-cols-2 gap-6">
              {votes.map((vote, index) => (
                <motion.div
                  key={vote.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${getCardColor(vote.estimate)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {getInitials(vote.user.name)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {vote.user.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Confidence: {vote.confidence || 3}⭐
                        </div>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {vote.estimate}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Vote summary */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {votes.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Votes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {averageConfidence}⭐
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Confidence</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {uniqueEstimates.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Unique Estimates</div>
                </div>
              </div>
            </div>

            {/* Estimate distribution */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Distribution</h4>
              {Object.entries(voteCounts).map(([estimate, count]) => (
                <div key={estimate} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium ${getCardColor(estimate)}`}>
                      {estimate}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{estimate}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-20">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(count / votes.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Consensus indicator */}
            {hasConsensus && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg"
              >
                <div className="flex items-center space-x-2 text-green-700 dark:text-green-200">
                  <FontAwesomeIcon icon={faCircleCheck} className="w-5 h-5" />
                  <span className="font-medium">Consensus reached! 🎉</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                  Everyone voted <strong>{uniqueEstimates[0]}</strong>
                </p>
              </motion.div>
            )}

            {/* Finalize estimate */}
            {isModerator && votes.length > 0 && !currentStory.finalEstimate && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Finalize Estimate</h4>
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedFinalEstimate}
                    onChange={(e) => setSelectedFinalEstimate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose final estimate</option>
                    {uniqueEstimates.map(estimate => (
                      <option key={estimate} value={estimate}>
                        {estimate} ({voteCounts[estimate]} vote{voteCounts[estimate] !== 1 ? 's' : ''})
                      </option>
                    ))}
                  </select>
                  <motion.button
                    onClick={handleFinalizeEstimate}
                    disabled={!selectedFinalEstimate || isLoading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Finalizing...' : 'Finalize'}
                  </motion.button>
                </div>
              </div>
            )}

            {currentStory.finalEstimate && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg text-center"
              >
                <div className="text-2xl mb-2">🏆</div>
                <div className="text-blue-700 dark:text-blue-200">
                  <span className="font-medium">Final Estimate: </span>
                  <span className="text-2xl font-bold">{currentStory.finalEstimate}</span>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="grid grid-cols-4 gap-4 mb-6 max-w-2xl mx-auto">
              {votes.map((vote, index) => (
                <motion.div
                  key={index}
                  className="aspect-[3/4] bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-xl flex flex-col items-center justify-center shadow-lg border-2 border-blue-400 dark:border-blue-300"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl shadow-md mb-2 tracking-wide">
                    {getInitials(vote.user.name)}
                  </div>
                  <div className="text-white text-sm font-semibold px-2 text-center truncate max-w-full tracking-wide">
                    {vote.user.name}
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {votes.length === 0 
                ? 'No votes yet...' 
                : `${votes.length} vote${votes.length !== 1 ? 's' : ''} hidden`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingResults;
