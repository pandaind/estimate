import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sessionAPI, voteAPI } from '../../utils/api';
import { handleError } from '../../utils/errorHandler';
import EstimationCards from '../EstimationCards';

/**
 * VotingPanel Component
 * Complete voting interface with reveal and reset controls
 */
const VotingPanel = ({ 
  session, 
  story, 
  currentUser,
  onVoteUpdate,
  onStoryUpdate 
}) => {
  const [votes, setVotes] = useState([]);
  const [myVote, setMyVote] = useState(null);
  const [confidence, setConfidence] = useState(3);
  const [loading, setLoading] = useState(false);
  const [revealLoading, setRevealLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const isModerator = session.moderatorId === currentUser?.id;
  const requireConfidence = session.settings?.requireConfidence;
  const allowChangeVote = session.settings?.allowChangeVote;

  useEffect(() => {
    if (story) {
      fetchVotes();
    }
  }, [story, session.votesRevealed]);

  const fetchVotes = async () => {
    try {
      const response = await voteAPI.get(
        session.sessionCode, 
        story.id, 
        session.votesRevealed
      );
      setVotes(response.data);
      
      // Find my vote
      const userVote = response.data.find(v => v.userId === currentUser.id);
      if (userVote) {
        setMyVote(userVote.value);
        if (userVote.confidence) {
          setConfidence(userVote.confidence);
        }
      }
    } catch (err) {
      handleError(err);
    }
  };

  const handleVoteCast = async (value) => {
    // Check if user can change vote
    if (myVote && !allowChangeVote) {
      return;
    }

    setLoading(true);
    try {
      await voteAPI.cast(session.sessionCode, story.id, currentUser.id, {
        value,
        confidence: requireConfidence ? confidence : undefined,
      });
      
      setMyVote(value);
      await fetchVotes();
      onVoteUpdate?.();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = async () => {
    setRevealLoading(true);
    try {
      const response = await sessionAPI.revealVotes(session.sessionCode);
      onStoryUpdate?.(response.data);
      await fetchVotes();
    } catch (err) {
      handleError(err);
    } finally {
      setRevealLoading(false);
    }
  };

  const handleReset = async () => {
    setResetLoading(true);
    try {
      await sessionAPI.resetVotes(session.sessionCode);
      setMyVote(null);
      setVotes([]);
      setConfidence(3);
      onStoryUpdate?.({ ...session, votesRevealed: false });
    } catch (err) {
      handleError(err);
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteVote = async () => {
    setLoading(true);
    try {
      await voteAPI.delete(session.sessionCode, story.id, currentUser.id);
      setMyVote(null);
      await fetchVotes();
      onVoteUpdate?.();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  if (!story) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Select a story to start voting
        </p>
      </div>
    );
  }

  const voteCount = votes.length;
  const totalVoters = session.statistics?.activeUsers || 0;
  const allVoted = voteCount >= totalVoters && totalVoters > 0;

  return (
    <div className="space-y-6">
      {/* Story Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {story.title}
        </h3>
        {story.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {story.description}
          </p>
        )}
        
        {/* Vote Status */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Votes: {voteCount}/{totalVoters}
            </span>
            {allVoted && !session.votesRevealed && (
              <span className="flex items-center text-green-600 dark:text-green-400">
                <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-1" />
                Everyone has voted!
              </span>
            )}
          </div>
          
          {/* Status Badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            session.votesRevealed
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
          }`}>
            {session.votesRevealed ? 'Revealed' : 'Voting'}
          </span>
        </div>
      </div>

      {/* Confidence Selector (if required) */}
      {requireConfidence && !session.votesRevealed && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Confidence Level: {confidence}/5
          </label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setConfidence(level)}
                className={`w-12 h-12 rounded-lg border-2 transition-all ${
                  confidence >= level
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            1 = Low confidence, 5 = High confidence
          </p>
        </div>
      )}

      {/* Estimation Cards */}
      {!session.votesRevealed && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            {myVote ? 'Your Vote' : 'Cast Your Vote'}
          </h4>
          
          {myVote && (
            <div className="mb-4 flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faCheck} className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-green-800 dark:text-green-300 font-medium">
                  You voted: {myVote}
                </span>
                {requireConfidence && (
                  <span className="text-sm text-green-600 dark:text-green-400">
                    (Confidence: {confidence}/5)
                  </span>
                )}
              </div>
              {allowChangeVote && (
                <button
                  onClick={handleDeleteVote}
                  disabled={loading}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm flex items-center space-x-1"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          )}
          
          <EstimationCards
            sizingMethod={session.sizingMethod}
            customValues={session.customValues}
            selectedValue={myVote}
            onSelect={handleVoteCast}
            disabled={loading || (myVote && !allowChangeVote)}
          />
          
          {myVote && !allowChangeVote && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
              Vote changes are disabled for this session
            </p>
          )}
        </div>
      )}

      {/* Moderator Controls */}
      {isModerator && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Moderator Controls
          </h4>
          <div className="flex space-x-3">
            {!session.votesRevealed ? (
              <button
                onClick={handleReveal}
                disabled={revealLoading || voteCount === 0}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {revealLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Revealing...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faEye} className="w-5 h-5" />
                    <span>Reveal Votes</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleReset}
                disabled={resetLoading}
                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {resetLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faArrowRotateLeft} className="w-5 h-5" />
                    <span>Reset Votes</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Revealed Votes */}
      {session.votesRevealed && votes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Votes
          </h4>
          <div className="grid grid-cols-4 gap-4">
            {votes.map((vote, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-600 rounded-lg p-4 text-center"
              >
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {vote.value}
                </div>
                {vote.confidence && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Confidence: {vote.confidence}/5
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingPanel;
