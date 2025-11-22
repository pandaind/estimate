import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Token management
const TOKEN_KEY = 'planning_poker_token';

export const tokenManager = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Authorization header
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    console.error('API Error:', errorMessage);
    
    // Clear token on 401 Unauthorized
    if (error.response?.status === 401) {
      tokenManager.clear();
    }
    
    return Promise.reject(error);
  }
);

// ==================== SESSION API ====================
export const sessionAPI = {
  // Create a new session
  create: (data) => api.post('/sessions', data),
  
  // Get session details
  get: (sessionCode) => api.get(`/sessions/${sessionCode}`),
  
  // Update session settings
  update: (sessionCode, data) => api.put(`/sessions/${sessionCode}`, data),
  
  // Delete/end session
  delete: (sessionCode) => api.delete(`/sessions/${sessionCode}`),
  
  // Join session - stores token automatically
  join: async (sessionCode, data) => {
    const response = await api.post(`/sessions/${sessionCode}/join`, data);
    if (response.data.token) {
      tokenManager.set(response.data.token);
    }
    return response;
  },
  
  // Leave session - clears token
  leave: async (sessionCode, userId) => {
    const response = await api.post(`/sessions/${sessionCode}/users/${userId}/leave`);
    tokenManager.clear();
    return response;
  },
  
  // Get users in session
  getUsers: (sessionCode, activeOnly = true) => 
    api.get(`/sessions/${sessionCode}/users`, { params: { activeOnly } }),
  
  // Set current story for voting
  setCurrentStory: (sessionCode, storyId) => 
    api.post(`/sessions/${sessionCode}/current-story`, null, { params: { storyId } }),
  
  // Reveal votes
  revealVotes: (sessionCode) => api.post(`/sessions/${sessionCode}/reveal`),
  
  // Reset votes
  resetVotes: (sessionCode) => api.post(`/sessions/${sessionCode}/reset-votes`),
};

// ==================== STORY API ====================
export const storyAPI = {
  // Create a new story
  create: (sessionCode, data) => api.post(`/sessions/${sessionCode}/stories`, data),
  
  // Get all stories
  getAll: (sessionCode, status = null) => 
    api.get(`/sessions/${sessionCode}/stories`, { params: { status } }),
  
  // Get single story
  get: (sessionCode, storyId) => api.get(`/sessions/${sessionCode}/stories/${storyId}`),
  
  // Update story
  update: (sessionCode, storyId, data) => 
    api.put(`/sessions/${sessionCode}/stories/${storyId}`, data),
  
  // Delete story
  delete: (sessionCode, storyId) => api.delete(`/sessions/${sessionCode}/stories/${storyId}`),
  
  // Finalize estimate
  finalize: (sessionCode, storyId, finalEstimate, notes = null) => 
    api.post(`/sessions/${sessionCode}/stories/${storyId}/finalize`, { 
      finalEstimate,
      notes 
    }),
  
  // Reset story for revoting
  reset: (sessionCode, storyId) => 
    api.post(`/sessions/${sessionCode}/stories/${storyId}/reset`),
};

// ==================== VOTE API ====================
export const voteAPI = {
  // Cast or update vote
  cast: (sessionCode, storyId, userId, data) => 
    api.post(`/sessions/${sessionCode}/stories/${storyId}/votes`, { 
      userId,
      ...data
    }),
  
  // Get votes for a story
  get: (sessionCode, storyId, revealed = false) => 
    api.get(`/sessions/${sessionCode}/stories/${storyId}/votes`, { params: { revealed } }),
  
  // Delete vote
  delete: (sessionCode, storyId, userId) => 
    api.delete(`/sessions/${sessionCode}/stories/${storyId}/votes/${userId}`),
};

// ==================== USER API ====================
export const userAPI = {
  // Get user details
  get: (sessionCode, userId) => api.get(`/sessions/${sessionCode}/users/${userId}`),
  
  // Update user profile
  update: (sessionCode, userId, data) => 
    api.put(`/sessions/${sessionCode}/users/${userId}`, data),
};

// ==================== ANALYTICS API ====================
export const analyticsAPI = {
  // Get session analytics
  getSession: (sessionCode) => api.get(`/sessions/${sessionCode}/analytics`),
  
  // Get story analytics
  getStory: (sessionCode, storyId) => 
    api.get(`/sessions/${sessionCode}/stories/${storyId}/analytics`),
};

// ==================== EXPORT/IMPORT API ====================
export const exportAPI = {
  // Export session data
  exportSession: (sessionCode, format = 'json') => 
    api.get(`/sessions/${sessionCode}/export`, { 
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json'
    }),
  
  // Import session data
  importSession: (data) => api.post('/sessions/import', data),
};

// ==================== UTILITY API ====================
export const utilityAPI = {
  // Get available sizing methods
  getSizingMethods: () => api.get('/sizing-methods'),
  
  // Health check
  health: () => api.get('/health'),
};

export default api;
