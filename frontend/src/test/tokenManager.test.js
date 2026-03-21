import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tokenManager } from '../utils/api';

// Mock localStorage for isolated testing
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('tokenManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('returns null when no token is stored', () => {
    expect(tokenManager.get()).toBeNull();
  });

  it('stores and retrieves a token', () => {
    tokenManager.set('my-test-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('planning_poker_token', 'my-test-token');
    localStorageMock.getItem.mockReturnValueOnce('my-test-token');
    expect(tokenManager.get()).toBe('my-test-token');
  });

  it('clears the token', () => {
    tokenManager.clear();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('planning_poker_token');
  });
});
