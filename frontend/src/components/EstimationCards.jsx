import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCardColor, getCardEmoji, SIZING_METHODS } from '../utils/constants';
import { voteAPI } from '../utils/api';

const EstimationCards = ({ session, currentStory, userName, userId, isModerator = false, onVoteSubmitted }) => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [confidence, setConfidence] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const sizingMethod = session.sizingMethod || 'FIBONACCI';
  const sizingValues = SIZING_METHODS[sizingMethod]?.values || SIZING_METHODS.FIBONACCI.values;

  useEffect(() => {
    setSelectedCard(null);
    setConfidence(3);
  }, [currentStory?.id]);

  const isStoryFinalized = currentStory?.finalEstimate !== null && currentStory?.finalEstimate !== undefined;
  const areVotesRevealed = session?.votesRevealed === true;
  const allowChangeVote = session?.allowChangeVote === true;
  const canParticipate = !isModerator || (session.moderatorCanVote === true);
  const votingEnabled = canParticipate && !isStoryFinalized && (!areVotesRevealed || allowChangeVote);
  const canVote = votingEnabled;

  const handleCardSelect = async (value) => {
    if (!currentStory || isSubmitting || !canVote) return;
    
    if (!userId) {
      console.error('Cannot vote: userId is not set');
      alert('Cannot vote: User ID is not available. Please rejoin the session.');
      return;
    }
    
    setSelectedCard(value);
    setIsSubmitting(true);

    try {
      await voteAPI.cast(session.sessionCode, currentStory.id, userId, {
        estimate: value,
        confidence
      });
      onVoteSubmitted();
    } catch (error) {
      console.error('Error submitting vote:', error);
      setSelectedCard(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentStory) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🤔</div>
        <h3 className="text-xl font-semibold text-gray-700">No story selected</h3>
        <p className="text-gray-500">Waiting for the facilitator to select a story...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {canVote ? 'Select your estimate' : 'Estimation Options'}
        </h3>
        {isModerator && !session.moderatorCanVote && (
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            As the host, you facilitate the session. Participants will vote on the story.
          </p>
        )}
        {!canVote && isStoryFinalized && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <p className="text-blue-800 dark:text-blue-200">
              🏆 This story has been finalized with estimate: <strong>{currentStory.finalEstimate}</strong>
            </p>
          </div>
        )}
        {!canVote && areVotesRevealed && !isStoryFinalized && !allowChangeVote && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <p className="text-yellow-800 dark:text-yellow-200">
              🔒 Voting is locked. Votes have been revealed.
            </p>
          </div>
        )}
        {canVote && areVotesRevealed && allowChangeVote && !isStoryFinalized && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <p className="text-green-800 dark:text-green-200">
              ✅ You can still change your vote before finalization
            </p>
          </div>
        )}
        {canVote && (
          <div className="flex items-center justify-center space-x-4 mb-6">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Confidence:
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setConfidence(level)}
                  className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                    confidence >= level
                      ? 'bg-yellow-400 text-yellow-900'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-6 gap-4 max-w-6xl mx-auto">
        {sizingValues.map((value, index) => {
          const emoji = getCardEmoji(value);
          const isSelected = selectedCard === value;
          
          return (
            <button
              key={value}
              onClick={() => handleCardSelect(value)}
              disabled={isSubmitting || !canVote}
              aria-label={`Vote ${value} points`}
              role="button"
              className={`relative min-h-[140px] flex flex-col items-center justify-center text-2xl font-bold rounded-xl border-2 transition-all ${
                isSelected 
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 scale-105 shadow-lg' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-400 hover:shadow-md'
              } ${getCardColor(value)} ${!canVote ? 'opacity-60 cursor-not-allowed' : ''} disabled:opacity-50`}
            >
              {emoji && <div className="text-3xl mb-2">{emoji}</div>}
              <div className={emoji ? 'text-lg' : 'text-3xl'}>
                {value}
              </div>
              
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                  ✓
                </div>
              )}
              
              {isSubmitting && isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 rounded-xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedCard && (
        <div className="text-center p-6 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl" role="status" aria-live="polite">
          <div className="text-green-800 dark:text-green-200 text-lg">
            ✅ You voted <strong>{selectedCard}</strong> with {confidence}⭐ confidence
          </div>
        </div>
      )}
    </div>
  );
};

export default EstimationCards;
