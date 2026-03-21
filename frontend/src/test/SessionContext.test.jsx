import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SessionProvider, useSession } from '../contexts/SessionContext';

// Prevent real localStorage usage from persisting across tests
beforeEach(() => {
  localStorage.clear();
});

// Helper component that exposes session state and dispatch for assertions
function StateCapture({ onCapture }) {
  const ctx = useSession();
  onCapture(ctx);
  return null;
}

function renderWithProvider(onCapture) {
  return render(
    <SessionProvider>
      <StateCapture onCapture={onCapture} />
    </SessionProvider>
  );
}

describe('SessionContext', () => {
  it('provides initial state with no session', () => {
    let captured;
    renderWithProvider((ctx) => { captured = ctx; });
    expect(captured.state.session).toBeNull();
    expect(captured.state.userName).toBe('');
    expect(captured.state.userId).toBeNull();
    expect(captured.state.isModerator).toBe(false);
  });

  it('SESSION_CREATED sets session, userName and marks user as moderator', () => {
    let captured;
    renderWithProvider((ctx) => { captured = ctx; });

    act(() => {
      captured.dispatch({
        type: 'SESSION_CREATED',
        payload: { session: { id: 1, sessionCode: 'ABC123', moderatorId: 99 }, userName: 'Alice', userId: 99 },
      });
    });

    expect(captured.state.session.sessionCode).toBe('ABC123');
    expect(captured.state.userName).toBe('Alice');
    expect(captured.state.userId).toBe(99);
    expect(captured.state.isModerator).toBe(true);
  });

  it('SESSION_CREATED falls back to moderatorId when userId not provided', () => {
    let captured;
    renderWithProvider((ctx) => { captured = ctx; });

    act(() => {
      captured.dispatch({
        type: 'SESSION_CREATED',
        payload: { session: { id: 2, sessionCode: 'XYZ', moderatorId: 55 } },
      });
    });

    expect(captured.state.userId).toBe(55);
    expect(captured.state.userName).toBe('Host');
  });

  it('SESSION_JOINED sets session and marks user as non-moderator', () => {
    let captured;
    renderWithProvider((ctx) => { captured = ctx; });

    act(() => {
      captured.dispatch({
        type: 'SESSION_JOINED',
        payload: { session: { id: 3, sessionCode: 'DEF456' }, userName: 'Bob', userId: 42 },
      });
    });

    expect(captured.state.session.sessionCode).toBe('DEF456');
    expect(captured.state.userName).toBe('Bob');
    expect(captured.state.userId).toBe(42);
    expect(captured.state.isModerator).toBe(false);
  });

  it('SESSION_LEFT resets state to initial', () => {
    let captured;
    renderWithProvider((ctx) => { captured = ctx; });

    act(() => {
      captured.dispatch({
        type: 'SESSION_JOINED',
        payload: { session: { id: 4, sessionCode: 'GHI' }, userName: 'Carol', userId: 7 },
      });
    });
    act(() => {
      captured.dispatch({ type: 'SESSION_LEFT' });
    });

    expect(captured.state.session).toBeNull();
    expect(captured.state.userName).toBe('');
    expect(captured.state.userId).toBeNull();
    expect(captured.state.isModerator).toBe(false);
  });

  it('SESSION_UPDATED merges partial session fields', () => {
    let captured;
    renderWithProvider((ctx) => { captured = ctx; });

    act(() => {
      captured.dispatch({
        type: 'SESSION_CREATED',
        payload: { session: { id: 5, sessionCode: 'UPD', status: 'WAITING' }, userName: 'Dan', userId: 1 },
      });
    });
    act(() => {
      captured.dispatch({ type: 'SESSION_UPDATED', payload: { status: 'VOTING' } });
    });

    expect(captured.state.session.status).toBe('VOTING');
    expect(captured.state.session.sessionCode).toBe('UPD');
  });

  it('throws when useSession is used outside SessionProvider', () => {
    // Suppress expected React error boundary output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Bad() { useSession(); return null; }
    expect(() => render(<Bad />)).toThrow('useSession must be used inside <SessionProvider>');
    spy.mockRestore();
  });
});
