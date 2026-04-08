'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { GridState, Phase } from './grid';
import { INITIAL_GRID_STATE } from './grid';

const POLL_INTERVAL = 500;

const PHASE_ORDER: Record<Phase, number> = {
  waiting: 0,
  voting: 1,
  revealed: 2,
};

/**
 * Decide whether incoming server state should replace the current client state.
 * Rules:
 * - If the incoming state is from a newer round (higher votingStartedAt), always accept
 * - If same round, only accept if the phase is equal or further along
 * - If same round + same phase, accept if it has more or equal votes (more = more up to date)
 * - If incoming is from an older round, reject entirely
 * - Always merge participants/names regardless
 */
function mergeState(prev: GridState, incoming: GridState): GridState {
  const mergedParticipants = { ...prev.participants, ...incoming.participants };
  const mergedNames = { ...prev.names, ...incoming.names };

  const prevRound = prev.votingStartedAt || 0;
  const incomingRound = incoming.votingStartedAt || 0;

  // Newer round — accept fully
  if (incomingRound > prevRound) {
    return { ...incoming, participants: mergedParticipants, names: mergedNames };
  }

  // Older round — keep current, just merge participants/names
  if (incomingRound < prevRound) {
    return { ...prev, participants: mergedParticipants, names: mergedNames };
  }

  // Same round — only move phase forward, never backward
  const prevPhase = PHASE_ORDER[prev.phase];
  const incomingPhase = PHASE_ORDER[incoming.phase];

  if (incomingPhase < prevPhase) {
    // Stale phase from another instance — keep current
    return { ...prev, participants: mergedParticipants, names: mergedNames };
  }

  if (incomingPhase > prevPhase) {
    // Phase advanced — accept
    return { ...incoming, participants: mergedParticipants, names: mergedNames };
  }

  // Same round, same phase — keep the one with more votes
  if (incoming.votes.length >= prev.votes.length) {
    return { ...incoming, participants: mergedParticipants, names: mergedNames };
  }

  return { ...prev, participants: mergedParticipants, names: mergedNames };
}

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
              setState((prev) => mergeState(prev, data));
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
    setState((prev) => mergeState(prev, newState));
  }, []);

  return { state, updateState };
}
