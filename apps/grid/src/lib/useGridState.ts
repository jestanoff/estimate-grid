'use client';

import { useEffect, useState, useCallback } from 'react';
import type { GridState, Phase } from './grid';
import { INITIAL_GRID_STATE, VOTING_DURATION_MS } from './grid';

const PHASE_ORDER: Record<Phase, number> = {
  waiting: 0,
  voting: 1,
  revealed: 2,
};

/**
 * Derive the correct phase from votingStartedAt.
 * If voting started and the time has elapsed, phase is 'revealed'.
 */
function computePhase(state: GridState): GridState {
  if (state.votingStartedAt && state.phase === 'voting') {
    const elapsed = Date.now() - state.votingStartedAt;
    if (elapsed >= VOTING_DURATION_MS) {
      return { ...state, phase: 'revealed' };
    }
  }
  return state;
}

/**
 * Merge incoming server state with the current client state.
 * - Newer round (higher votingStartedAt) always wins
 * - Same round: phase only moves forward, votes prefer the larger set
 * - Older round: rejected (only merge participants/names)
 * - Participants/names always merged
 */
function mergeState(prev: GridState, incoming: GridState): GridState {
  // Compute correct phase for both before comparing
  const prevComputed = computePhase(prev);
  const incomingComputed = computePhase(incoming);

  const mergedParticipants = { ...prevComputed.participants, ...incomingComputed.participants };
  const mergedNames = { ...prevComputed.names, ...incomingComputed.names };

  const prevRound = prevComputed.votingStartedAt || 0;
  const incomingRound = incomingComputed.votingStartedAt || 0;

  // Newer round — accept fully
  if (incomingRound > prevRound) {
    return { ...incomingComputed, participants: mergedParticipants, names: mergedNames };
  }

  // Older round — keep current, just merge participants/names
  if (incomingRound < prevRound) {
    return { ...prevComputed, participants: mergedParticipants, names: mergedNames };
  }

  // Same round — only move phase forward, never backward
  const prevPhase = PHASE_ORDER[prevComputed.phase];
  const incomingPhase = PHASE_ORDER[incomingComputed.phase];

  if (incomingPhase < prevPhase) {
    return { ...prevComputed, participants: mergedParticipants, names: mergedNames };
  }

  if (incomingPhase > prevPhase) {
    return { ...incomingComputed, participants: mergedParticipants, names: mergedNames };
  }

  // Same round, same phase — merge votes (union by participantId, prefer incoming for conflicts)
  const voteMap = new Map(prevComputed.votes.map((v) => [v.participantId, v]));
  for (const v of incomingComputed.votes) {
    voteMap.set(v.participantId, v);
  }

  return {
    ...incomingComputed,
    votes: Array.from(voteMap.values()),
    participants: mergedParticipants,
    names: mergedNames,
  };
}

export function useGridState(roomId: string): {
  state: GridState;
  updateState: (state: GridState) => void;
} {
  const [state, setState] = useState<GridState>(INITIAL_GRID_STATE);

  // Client-side timer: transition voting → revealed when time elapses
  useEffect(() => {
    if (state.phase !== 'voting' || !state.votingStartedAt) return;

    const remaining = VOTING_DURATION_MS - (Date.now() - state.votingStartedAt);
    if (remaining <= 0) {
      setState((prev) => computePhase(prev));
      return;
    }

    const timer = setTimeout(() => {
      setState((prev) => computePhase(prev));
    }, remaining);

    return () => clearTimeout(timer);
  }, [state.phase, state.votingStartedAt]);

  // SSE: server pushes state whenever it changes
  useEffect(() => {
    const es = new EventSource(`/api/room/${roomId}/events`);

    es.onmessage = (e) => {
      try {
        const data: GridState = JSON.parse(e.data);
        setState((prev) => mergeState(prev, data));
      } catch {
        // ignore parse errors
      }
    };

    return () => es.close();
  }, [roomId]);

  const updateState = useCallback((newState: GridState) => {
    setState((prev) => mergeState(prev, newState));
  }, []);

  return { state, updateState };
}
