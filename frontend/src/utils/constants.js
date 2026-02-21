// ==================== STORAGE KEYS ====================
export const STORAGE_KEYS = {
  SESSION:      'pp_session',
  USER_NAME:    'pp_userName',
  USER_ID:      'pp_userId',
  IS_MODERATOR: 'pp_isModerator',
  ACTIVE_TAB:   'pp_activeTab',
};

export const SIZING_METHODS = {
  FIBONACCI: {
    name: 'Fibonacci',
    values: ['1', '2', '3', '5', '8', '13', '21', '∞', '?', '☕']
  },
  T_SHIRT: {
    name: 'T-Shirt Sizes',
    values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '∞', '?', '☕']
  },
  POWERS_OF_2: {
    name: 'Powers of 2',
    values: ['1', '2', '4', '8', '16', '32', '64', '∞', '?', '☕']
  },
  LINEAR: {
    name: 'Linear Scale',
    values: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '∞', '?', '☕']
  },
  CUSTOM: {
    name: 'Custom',
    values: []
  }
};

export const STORY_STATUS = {
  NOT_ESTIMATED: 'Not Estimated',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed'
};

export const AVATARS = [
  '🧑‍💻', '👩‍💻', '🧑‍💼', '👩‍💼', '🧑‍🎨', '👩‍🎨',
  '🧑‍🏫', '👩‍🏫', '🧑‍🔬', '👩‍🔬', '🧑‍🚀', '👩‍🚀',
  '🦸‍♂️', '🦸‍♀️', '🧙‍♂️', '🧙‍♀️', '🥷', '🦹‍♂️',
  '🦹‍♀️', '🧚‍♂️', '🧚‍♀️', '🦄', '🐱', '🐶'
];

export const getCardColor = (estimate) => {
  switch (estimate) {
    case '?':
      return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200';
    case '☕':
      return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-600 text-orange-800 dark:text-orange-200';
    case '∞':
      return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-600 text-red-800 dark:text-red-200';
    default:
      return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-800 dark:text-blue-200';
  }
};

export const getCardEmoji = (estimate) => {
  switch (estimate) {
    case '?':
      return '❓';
    case '☕':
      return '☕';
    case '∞':
      return '♾️';
    default:
      return null;
  }
};

export const generateSessionCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
