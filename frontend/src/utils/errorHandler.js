/**
 * Centralized Error Handler for EstiMate API
 */

// Error types
export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

// Error messages
export const ErrorMessages = {
  [ErrorTypes.NETWORK_ERROR]: 'Network error. Please check your connection.',
  [ErrorTypes.VALIDATION_ERROR]: 'Invalid input. Please check your data.',
  [ErrorTypes.NOT_FOUND]: 'Resource not found.',
  [ErrorTypes.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ErrorTypes.UNAUTHORIZED]: 'Please log in to continue.',
  [ErrorTypes.SERVER_ERROR]: 'Server error. Please try again later.',
  [ErrorTypes.UNKNOWN_ERROR]: 'An unexpected error occurred.',
};

/**
 * Parse error from API response
 * @param {Error} error - Axios error object
 * @returns {Object} Parsed error with type, message, and details
 */
export const parseError = (error) => {
  if (!error.response) {
    // Network error
    return {
      type: ErrorTypes.NETWORK_ERROR,
      message: ErrorMessages[ErrorTypes.NETWORK_ERROR],
      originalError: error,
    };
  }

  const { status, data } = error.response;

  // Determine error type based on status code
  let errorType = ErrorTypes.UNKNOWN_ERROR;
  switch (status) {
    case 400:
      errorType = ErrorTypes.VALIDATION_ERROR;
      break;
    case 401:
      errorType = ErrorTypes.UNAUTHORIZED;
      break;
    case 403:
      errorType = ErrorTypes.FORBIDDEN;
      break;
    case 404:
      errorType = ErrorTypes.NOT_FOUND;
      break;
    case 500:
    case 502:
    case 503:
      errorType = ErrorTypes.SERVER_ERROR;
      break;
    default:
      errorType = ErrorTypes.UNKNOWN_ERROR;
  }

  return {
    type: errorType,
    message: data?.message || ErrorMessages[errorType],
    status,
    details: data?.errors || null,
    timestamp: data?.timestamp || new Date().toISOString(),
    path: data?.path || null,
    originalError: error,
  };
};

/**
 * Handle API error with user-friendly message
 * @param {Error} error - Error object
 * @param {Function} [onError] - Optional callback to handle error
 * @returns {Object} Parsed error
 */
export const handleError = (error, onError) => {
  const parsedError = parseError(error);
  
  // Log error for debugging
  console.error('[API Error]', {
    type: parsedError.type,
    message: parsedError.message,
    status: parsedError.status,
    details: parsedError.details,
  });

  // Call optional error handler
  if (onError && typeof onError === 'function') {
    onError(parsedError);
  }

  return parsedError;
};

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  const parsedError = parseError(error);
  return parsedError.message;
};

/**
 * Check if error is of specific type
 * @param {Error} error - Error object
 * @param {string} type - Error type from ErrorTypes
 * @returns {boolean} Whether error matches type
 */
export const isErrorType = (error, type) => {
  const parsedError = parseError(error);
  return parsedError.type === type;
};

/**
 * Check if error is retryable
 * @param {Error} error - Error object
 * @returns {boolean} Whether error can be retried
 */
export const isRetryableError = (error) => {
  const parsedError = parseError(error);
  return [
    ErrorTypes.NETWORK_ERROR,
    ErrorTypes.SERVER_ERROR,
  ].includes(parsedError.type);
};

/**
 * Create error for toast notification
 * @param {Error} error - Error object
 * @returns {Object} Toast configuration
 */
export const createErrorToast = (error) => {
  const parsedError = parseError(error);
  
  return {
    type: 'error',
    message: parsedError.message,
    duration: 5000,
    details: parsedError.details,
  };
};

/**
 * Retry API request with exponential backoff
 * @param {Function} requestFn - Function that returns a promise
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Promise} Result of the request
 */
export const retryRequest = async (
  requestFn,
  maxRetries = 3,
  initialDelay = 1000
) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

export default {
  ErrorTypes,
  ErrorMessages,
  parseError,
  handleError,
  getErrorMessage,
  isErrorType,
  isRetryableError,
  createErrorToast,
  retryRequest,
};
