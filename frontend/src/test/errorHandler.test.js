import { describe, it, expect, vi } from 'vitest';
import { parseError, handleError, ErrorTypes, ErrorMessages } from '../utils/errorHandler';

describe('parseError', () => {
  it('returns NETWORK_ERROR when there is no response', () => {
    const error = new Error('Network Error');
    const result = parseError(error);
    expect(result.type).toBe(ErrorTypes.NETWORK_ERROR);
    expect(result.message).toBe(ErrorMessages[ErrorTypes.NETWORK_ERROR]);
    expect(result.originalError).toBe(error);
  });

  it('returns VALIDATION_ERROR for 400 status', () => {
    const error = { response: { status: 400, data: { message: 'Bad input' } } };
    const result = parseError(error);
    expect(result.type).toBe(ErrorTypes.VALIDATION_ERROR);
    expect(result.message).toBe('Bad input');
    expect(result.status).toBe(400);
  });

  it('returns UNAUTHORIZED for 401 status', () => {
    const error = { response: { status: 401, data: {} } };
    const result = parseError(error);
    expect(result.type).toBe(ErrorTypes.UNAUTHORIZED);
  });

  it('returns FORBIDDEN for 403 status', () => {
    const error = { response: { status: 403, data: {} } };
    const result = parseError(error);
    expect(result.type).toBe(ErrorTypes.FORBIDDEN);
  });

  it('returns NOT_FOUND for 404 status', () => {
    const error = { response: { status: 404, data: {} } };
    const result = parseError(error);
    expect(result.type).toBe(ErrorTypes.NOT_FOUND);
  });

  it('returns SERVER_ERROR for 500 status', () => {
    const error = { response: { status: 500, data: {} } };
    const result = parseError(error);
    expect(result.type).toBe(ErrorTypes.SERVER_ERROR);
  });

  it('returns SERVER_ERROR for 502 and 503 status', () => {
    expect(parseError({ response: { status: 502, data: {} } }).type).toBe(ErrorTypes.SERVER_ERROR);
    expect(parseError({ response: { status: 503, data: {} } }).type).toBe(ErrorTypes.SERVER_ERROR);
  });

  it('returns UNKNOWN_ERROR for unhandled status codes', () => {
    const error = { response: { status: 418, data: {} } };
    const result = parseError(error);
    expect(result.type).toBe(ErrorTypes.UNKNOWN_ERROR);
  });

  it('includes details and path from response data', () => {
    const error = {
      response: {
        status: 400,
        data: { message: 'Validation failed', errors: ['field required'], path: '/api/sessions' },
      },
    };
    const result = parseError(error);
    expect(result.details).toEqual(['field required']);
    expect(result.path).toBe('/api/sessions');
  });

  it('falls back to default message when response data has no message', () => {
    const error = { response: { status: 404, data: {} } };
    const result = parseError(error);
    expect(result.message).toBe(ErrorMessages[ErrorTypes.NOT_FOUND]);
  });
});

describe('handleError', () => {
  it('calls the onError callback with parsed error', () => {
    const onError = vi.fn();
    const error = { response: { status: 404, data: {} } };
    handleError(error, onError);
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0].type).toBe(ErrorTypes.NOT_FOUND);
  });

  it('does not throw when onError is not provided', () => {
    const error = { response: { status: 500, data: {} } };
    expect(() => handleError(error)).not.toThrow();
  });
});
