'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { GridState } from './grid';
import { INITIAL_GRID_STATE } from './grid';

const POLL_INTERVAL = 500;

export function useGridState(roomId: string): {
  state: GridState;
  updateState: (state: GridState) => void;
} {
  const [state, setState] = useState<GridState>(INITIAL_GRID_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let active = true;

    async function poll() {
      while (active) {
        try {
          // Send our known participants/names so any fresh instance learns about them
          const current = stateRef.current;
          const res = await fetch(`/api/room/${roomId}/state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participants: current.participants,
              names: current.names,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (active) {
              // Merge: keep the richer participants/names set
              setState((prev) => ({
                ...data,
                participants: { ...prev.participants, ...data.participants },
                names: { ...prev.names, ...data.names },
              }));
            }
          }
        } catch {
          // ignore fetch errors, retry on next poll
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      }
    }

    poll();
    return () => { active = false; };
  }, [roomId]);

  const updateState = useCallback((newState: GridState) => {
    setState((prev) => ({
      ...newState,
      participants: { ...prev.participants, ...newState.participants },
      names: { ...prev.names, ...newState.names },
    }));
  }, []);

  return { state, updateState };
}
