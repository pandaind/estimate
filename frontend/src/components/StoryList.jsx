import React, { useState, useEffect } from 'react';
import { storyAPI, voteAPI, sessionAPI } from '../utils/api';
import { toast } from 'sonner';
import { parseError } from '../utils/errorHandler';
import { cn } from '../utils/cn';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPlay, faCircleCheck, faEye, faLock, faArrowRotateLeft, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import StoryEditor from './story/StoryEditor';

// Helper function to get user initials
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const StoryList = ({ session, onStorySelected, currentStory, userName, isModerator = false, refreshKey, showCreateForm, onToggleCreateForm }) => {
  const [stories, setStories] = useState([]);
  const [newStory, setNewStory] = useState({ 
    title: '', 
    description: '', 
    acceptanceCriteria: '',
    tags: [],
    priority: 'MEDIUM'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [votes, setVotes] = useState({});
  const [revealedStories, setRevealedStories] = useState(new Set());
  const [editingStory, setEditingStory] = useState(null);
  const [deletingStoryId, setDeletingStoryId] = useState(null);

  useEffect(() => {
    fetchStories();
  }, [session]);

  // Notify parent of stories for navigation
  useEffect(() => {
    if (session.onStoriesUpdate) {
      session.onStoriesUpdate(stories);
    }
  }, [stories]);

  useEffect(() => {
    if (currentStory) {
      fetchVotes(currentStory.id);
    }
  }, [currentStory, refreshKey]);

  // Sync revealed state with session's votesRevealed flag
  useEffect(() => {
    if (session?.votesRevealed && currentStory?.id) {
      setRevealedStories(prev => {
        const newSet = new Set(prev);
        newSet.add(currentStory.id);
        return newSet;
      });
    }
  }, [session?.votesRevealed, currentStory?.id]);

  const fetchStories = async () => {
    try {
      const response = await storyAPI.getAll(session.sessionCode);
      setStories(response.data);
    } catch (error) {
      toast.error(parseError(error).message);
    }
  };

  const fetchVotes = async (storyId) => {
    try {
      const response = await voteAPI.get(session.sessionCode, storyId);
      setVotes(prev => ({
        ...prev,
        [storyId]: response.data
      }));
    } catch (error) {
      toast.error(parseError(error).message);
    }
  };

  const handleCreateStory = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      await storyAPI.create(session.sessionCode, newStory);
      setNewStory({ 
        title: '', 
        description: '', 
        acceptanceCriteria: '',
        tags: [],
        priority: 'MEDIUM'
      });
      onToggleCreateForm();
      fetchStories();
    } catch (error) {
      toast.error(parseError(error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStoryVotes = (storyId) => {
    return votes[storyId] || [];
  };

  const handleRevealVotes = async (storyId) => {
    if (revealedStories.has(storyId)) return;
    
    try {
      await sessionAPI.revealVotes(session.sessionCode);
      setRevealedStories(prev => {
        const newSet = new Set(prev);
        newSet.add(storyId);
        return newSet;
      });
    } catch (error) {
      toast.error(parseError(error).message);
    }
  };

  const handleFinalize = async (story, estimate) => {
    try {
      await storyAPI.finalize(session.sessionCode, story.id, estimate, null);
      fetchStories();
    } catch (error) {
      toast.error(parseError(error).message);
    }
  };

  const handleRevote = async (story) => {
    if (!confirm(`Reset "${story.title}" and allow revoting? This will clear the final estimate and all votes.`)) {
      return;
    }
    
    try {
      await storyAPI.reset(session.sessionCode, story.id);
      setVotes(prev => ({
        ...prev,
        [story.id]: []
      }));
      setRevealedStories(prev => {
        const newSet = new Set(prev);
        newSet.delete(story.id);
        return newSet;
      });
      fetchStories();
    } catch (error) {
      toast.error(parseError(error).message);
    }
  };

  const handleDeleteStory = async (storyId) => {
    try {
      await storyAPI.delete(session.sessionCode, storyId);
      setDeletingStoryId(null);
      fetchStories();
      toast.success('Story deleted');
    } catch (error) {
      toast.error(parseError(error).message);
    }
  };

  const handleEditSaved = () => {
    setEditingStory(null);
    fetchStories();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Stories</h2>
        {isModerator && (
          <button
            data-testid="btn-add-story"
            onClick={onToggleCreateForm}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            <span>Add Story</span>
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <form onSubmit={handleCreateStory} className="space-y-4">
            <div>
              <label htmlFor="story-title" className="sr-only">Story title</label>
              <input
                type="text"
                id="story-title"
                name="storyTitle"
                aria-label="Story title"
                value={newStory.title}
                onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                placeholder="Story title"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="story-description" className="sr-only">Story description</label>
              <textarea
                id="story-description"
                name="storyDescription"
                aria-label="Story description"
                value={newStory.description}
                onChange={(e) => setNewStory({ ...newStory, description: e.target.value })}
                placeholder="Story description (optional)"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                data-testid="btn-create-story"
                disabled={isCreating}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Story'}
              </button>
              <button
                type="button"
                onClick={onToggleCreateForm}
                className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stories List */}
      <div className="space-y-3">
        {stories.map((story) => {
          const storyVotes = getStoryVotes(story.id);
          const isActive = currentStory?.id === story.id;
          const isRevealed = revealedStories.has(story.id);
          const isFinalized = story.status === 'COMPLETED';
          
          const voteCounts = storyVotes.reduce((acc, vote) => {
            acc[vote.estimate] = (acc[vote.estimate] || 0) + 1;
            return acc;
          }, {});
          
          return (
            <div
              key={story.id}
              className={cn(
                'bg-white dark:bg-gray-900 rounded-xl border-2 transition-all',
                isActive ? 'border-blue-600 shadow-lg' : 'border-gray-200 dark:border-gray-800'
              )}
            >
              <div className="p-5">
                {/* Story Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {story.title}
                      </h3>
                      {isActive && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-lg flex items-center gap-1">
                          <FontAwesomeIcon icon={faPlay} className="w-3 h-3" />
                          Active
                        </span>
                      )}
                      {isFinalized && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs font-medium rounded-lg flex items-center gap-1">
                          <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3" />
                          {story.finalEstimate}
                        </span>
                      )}
                    </div>
                    {story.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {story.description}
                      </p>
                    )}
                  </div>
                  {isModerator && (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        data-testid={`btn-edit-story-${story.id}`}
                        onClick={() => setEditingStory(story)}
                        aria-label={`Edit ${story.title}`}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} className="w-4 h-4" />
                      </button>
                      <button
                        data-testid={`btn-delete-story-${story.id}`}
                        onClick={() => setDeletingStoryId(story.id)}
                        aria-label={`Delete ${story.title}`}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                      >
                        <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Voting Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {storyVotes.length} {storyVotes.length === 1 ? 'vote' : 'votes'}
                  </div>
                </div>

                {/* Action Buttons (Moderator Only) */}
                {isModerator && (
                  <div className="flex flex-wrap gap-2">
                    {/* Step 1: Activate for Voting */}
                    {!isActive && !isFinalized && (
                      <button
                        data-testid={`btn-activate-story-${story.id}`}
                        onClick={() => onStorySelected(story)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faPlay} className="w-4 h-4" />
                        Activate for Voting
                      </button>
                    )}
                    
                    {/* Revote - for finalized stories */}
                    {isFinalized && (
                      <button
                        onClick={() => handleRevote(story)}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faArrowRotateLeft} className="w-4 h-4" />
                        Revote
                      </button>
                    )}

                    {/* Step 2: Reveal Votes */}
                    {isActive && storyVotes.length > 0 && !isFinalized && !isRevealed && (
                      <button
                        data-testid={`btn-reveal-votes-${story.id}`}
                        onClick={() => handleRevealVotes(story.id)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                        Reveal Votes
                      </button>
                    )}
                    
                    {/* Revealed indicator */}
                    {isActive && isRevealed && !isFinalized && (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                        <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4" />
                        Votes Revealed
                      </div>
                    )}

                    {/* Step 3: Finalize */}
                    {isActive && isRevealed && !isFinalized && storyVotes.length > 0 && (
                      <div className="flex items-center gap-2 min-w-0">
                        <select
                          aria-label="Select final estimate"
                          onChange={(e) => e.target.value && handleFinalize(story, e.target.value)}
                          className="min-w-0 flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm"
                          defaultValue=""
                        >
                          <option value="" disabled>Finalize with...</option>
                          {Object.keys(voteCounts).sort((a, b) => voteCounts[b] - voteCounts[a]).map(estimate => (
                            <option key={estimate} value={estimate}>
                              {estimate} ({voteCounts[estimate]} {voteCounts[estimate] === 1 ? 'vote' : 'votes'})
                            </option>
                          ))}
                        </select>
                        <FontAwesomeIcon icon={faLock} className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                )}

                {/* Vote Results (When Revealed) */}
                {isRevealed && storyVotes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {storyVotes.map((vote) => (
                        <div
                          key={vote.id}
                          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                              {getInitials(vote.user.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {vote.user.name}
                                </span>
                                <span className="text-lg font-bold text-blue-600 ml-2">
                                  {vote.estimate}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 ml-9">
                            {vote.confidence}⭐ confidence
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {stories.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No stories yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Create your first story to get started!
            </p>
          </div>
        )}
      </div>

      {/* Edit Story Modal */}
      {editingStory && (
        <StoryEditor
          sessionCode={session.sessionCode}
          story={editingStory}
          onSave={handleEditSaved}
          onClose={() => setEditingStory(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingStoryId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Confirm delete story">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Story</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this story? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingStoryId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                data-testid="btn-confirm-delete"
                onClick={() => handleDeleteStory(deletingStoryId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryList;
