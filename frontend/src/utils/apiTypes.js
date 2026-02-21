/**
 * API Type Definitions (JSDoc — documentation only, not imported at runtime)
 *
 * This file contains JSDoc @typedef declarations used solely as inline
 * documentation / IDE auto-complete helpers.  It is intentionally NOT
 * imported by any component.  If runtime validation is ever needed, migrate
 * these definitions to Zod schemas instead.
 */

// ==================== ENUMS ====================

/**
 * @typedef {'FIBONACCI' | 'T_SHIRT' | 'POWERS_OF_2' | 'LINEAR' | 'CUSTOM'} SizingMethod
 */

/**
 * @typedef {'NOT_ESTIMATED' | 'IN_PROGRESS' | 'COMPLETED'} StoryStatus
 */

/**
 * @typedef {'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'} Priority
 */

// ==================== SESSION TYPES ====================

/**
 * @typedef {Object} SessionSettings
 * @property {boolean} [autoReveal=false] - Automatically reveal when all users vote
 * @property {boolean} [timerEnabled=false] - Enable voting timer
 * @property {number} [timerDuration=300] - Timer duration in seconds (30-3600)
 * @property {boolean} [allowChangeVote=true] - Allow users to change their votes
 * @property {boolean} [allowObservers=true] - Allow observers who don't vote
 * @property {boolean} [requireConfidence=false] - Require confidence level with votes
 */

/**
 * @typedef {Object} SessionStatistics
 * @property {number} totalStories - Total number of stories
 * @property {number} completedStories - Number of completed stories
 * @property {number} activeUsers - Number of active users
 * @property {number} averageVotingTime - Average voting time in seconds
 */

/**
 * @typedef {Object} CreateSessionRequest
 * @property {string} name - Session name (3-100 chars)
 * @property {string} [description] - Session description (max 500 chars)
 * @property {SizingMethod} sizingMethod - Sizing methodology
 * @property {string[]} [customValues] - Custom values (required if sizingMethod is CUSTOM)
 * @property {string} moderatorName - Name of the moderator (1-50 chars)
 * @property {string} [moderatorAvatar] - Avatar identifier for moderator
 * @property {SessionSettings} [settings] - Session configuration
 */

/**
 * @typedef {Object} UpdateSessionRequest
 * @property {string} [name] - Session name (3-100 chars)
 * @property {string} [description] - Session description (max 500 chars)
 * @property {SessionSettings} [settings] - Session configuration
 */

/**
 * @typedef {Object} Session
 * @property {number} id - Session ID
 * @property {string} sessionCode - 6-character session code
 * @property {string} name - Session name
 * @property {string} [description] - Session description
 * @property {SizingMethod} sizingMethod - Sizing method
 * @property {string[]} [customValues] - Custom sizing values
 * @property {number} moderatorId - Moderator user ID
 * @property {number} [currentStoryId] - Current story being estimated
 * @property {boolean} votesRevealed - Whether votes are revealed
 * @property {boolean} isActive - Whether session is active
 * @property {SessionSettings} settings - Session settings
 * @property {SessionStatistics} [statistics] - Session statistics
 * @property {string} createdAt - ISO date-time
 * @property {string} updatedAt - ISO date-time
 */

/**
 * @typedef {Object} JoinSessionRequest
 * @property {string} name - User name (1-50 chars)
 * @property {string} [avatar] - Avatar identifier
 * @property {boolean} [isObserver=false] - Join as observer (can't vote)
 */

/**
 * @typedef {Object} UserSession
 * @property {string} sessionCode - Session code
 * @property {number} userId - User ID
 * @property {User} user - User details
 * @property {Session} session - Session details
 */

// ==================== STORY TYPES ====================

/**
 * @typedef {Object} CreateStoryRequest
 * @property {string} title - Story title (1-200 chars)
 * @property {string} [description] - Story description (max 2000 chars)
 * @property {string} [acceptanceCriteria] - Acceptance criteria (max 2000 chars)
 * @property {string[]} [tags] - Story tags
 * @property {Priority} [priority='MEDIUM'] - Story priority
 */

/**
 * @typedef {Object} UpdateStoryRequest
 * @property {string} [title] - Story title (1-200 chars)
 * @property {string} [description] - Story description (max 2000 chars)
 * @property {string} [acceptanceCriteria] - Acceptance criteria (max 2000 chars)
 * @property {string[]} [tags] - Story tags
 * @property {Priority} [priority] - Story priority
 */

/**
 * @typedef {Object} Story
 * @property {number} id - Story ID
 * @property {number} sessionId - Session ID
 * @property {string} title - Story title
 * @property {string} [description] - Story description
 * @property {string} [acceptanceCriteria] - Acceptance criteria
 * @property {string[]} tags - Story tags
 * @property {Priority} priority - Story priority
 * @property {StoryStatus} status - Story status
 * @property {string} [finalEstimate] - Final agreed estimate
 * @property {string} [estimateNotes] - Notes about the estimate
 * @property {number} orderIndex - Position in backlog
 * @property {string} createdAt - ISO date-time
 * @property {string} updatedAt - ISO date-time
 */

/**
 * @typedef {Object} FinalizeEstimateRequest
 * @property {string} finalEstimate - The final agreed estimate
 * @property {string} [notes] - Optional notes about the estimate
 */

// ==================== VOTE TYPES ====================

/**
 * @typedef {Object} VoteRequest
 * @property {string} value - Vote value
 * @property {number} [confidence] - Confidence level (1-5)
 */

/**
 * @typedef {Object} Vote
 * @property {number} id - Vote ID
 * @property {number} userId - User ID who cast the vote
 * @property {number} storyId - Story ID
 * @property {string} value - Vote value
 * @property {number} [confidence] - Confidence level (1-5)
 * @property {string} createdAt - ISO date-time
 * @property {string} updatedAt - ISO date-time
 */

/**
 * @typedef {Object} VoteReveal
 * @property {number} storyId - Story ID
 * @property {Vote[]} votes - All votes
 * @property {Object} statistics - Vote statistics
 * @property {number} statistics.totalVotes - Total votes cast
 * @property {string} [statistics.average] - Average vote value
 * @property {string} [statistics.median] - Median vote value
 * @property {string} [statistics.mode] - Most common vote value
 * @property {Object.<string, number>} statistics.distribution - Vote distribution
 */

// ==================== USER TYPES ====================

/**
 * @typedef {Object} UpdateUserRequest
 * @property {string} [name] - User name (1-50 chars)
 * @property {string} [avatar] - Avatar identifier
 */

/**
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} name - User name
 * @property {string} [avatar] - Avatar identifier
 * @property {boolean} isObserver - Whether user is an observer
 * @property {boolean} isActive - Whether user is active in session
 * @property {string} joinedAt - ISO date-time
 * @property {string} [lastActivity] - ISO date-time of last activity
 */

// ==================== ANALYTICS TYPES ====================

/**
 * @typedef {Object} StoryAnalyticsStatistics
 * @property {number} mean - Mean vote value
 * @property {number} median - Median vote value
 * @property {number} mode - Mode vote value
 * @property {number} standardDeviation - Standard deviation
 */

/**
 * @typedef {Object} StoryAnalytics
 * @property {number} storyId - Story ID
 * @property {number} voteCount - Number of votes
 * @property {Object.<string, number>} distribution - Vote distribution
 * @property {number} consensus - Consensus percentage (0-100)
 * @property {StoryAnalyticsStatistics} [statistics] - Statistical measures (for numeric votes)
 */

/**
 * @typedef {Object} VelocityMetrics
 * @property {number} storiesPerHour - Stories estimated per hour
 * @property {number} averageTimePerStory - Average time per story in seconds
 */

/**
 * @typedef {Object} ParticipantActivity
 * @property {number} userId - User ID
 * @property {string} userName - User name
 * @property {number} votesCount - Number of votes cast
 * @property {number} participationRate - Participation percentage (0-100)
 */

/**
 * @typedef {Object} SessionAnalytics
 * @property {string} sessionCode - Session code
 * @property {number} totalStories - Total stories
 * @property {number} completedStories - Completed stories
 * @property {number} inProgressStories - In-progress stories
 * @property {number} participantCount - Number of participants
 * @property {number} consensusRate - Consensus rate percentage (0-100)
 * @property {VelocityMetrics} velocityMetrics - Velocity metrics
 * @property {ParticipantActivity[]} participantActivity - Activity per participant
 */

// ==================== EXPORT/IMPORT TYPES ====================

/**
 * @typedef {Object} SessionExport
 * @property {Session} session - Session data
 * @property {Story[]} stories - All stories
 * @property {Vote[]} votes - All votes
 * @property {User[]} users - All users
 * @property {string} exportedAt - ISO date-time of export
 */

/**
 * @typedef {Object} SessionImport
 * @property {SessionExport} data - Exported session data
 * @property {boolean} [generateNewCode=true] - Generate new session code
 */

// ==================== UTILITY TYPES ====================

/**
 * @typedef {Object} SizingMethodInfo
 * @property {SizingMethod} name - Method name
 * @property {string} displayName - Human-readable name
 * @property {string} description - Method description
 * @property {string[]} values - Available values
 */

/**
 * @typedef {Object} HealthResponse
 * @property {string} status - Health status (UP/DOWN)
 * @property {string} timestamp - ISO date-time
 */

// ==================== ERROR TYPES ====================

/**
 * @typedef {Object} ErrorResponse
 * @property {string} message - Error message
 * @property {number} status - HTTP status code
 * @property {string} [timestamp] - ISO date-time
 * @property {string} [path] - Request path
 * @property {Object} [errors] - Validation errors
 */

export {};
