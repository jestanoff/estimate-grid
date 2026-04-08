import { GridState, Vote, INITIAL_GRID_STATE, VOTING_DURATION_MS } from './grid';
import { getRandomEmoji, pickRandomCategory, type EmojiCategory } from './emojis';

const ROOM_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours inactivity

type RoomState = {
  state: GridState;
  emojiCategory: EmojiCategory;
  createdAt: number;
  lastActivityAt: number;
};

const rooms = new Map<string, RoomState>();
const subscribers = new Map<string, Set<(state: GridState) => void>>();

export function subscribe(roomId: string, cb: (state: GridState) => void): () => void {
  let subs = subscribers.get(roomId);
  if (!subs) {
    subs = new Set();
    subscribers.set(roomId, subs);
  }
  subs.add(cb);
  return () => subs!.delete(cb);
}

function notify(roomId: string): void {
  const subs = subscribers.get(roomId);
  if (!subs || subs.size === 0) return;
  const state = getState(roomId);
  for (const cb of subs) {
    try { cb(state); } catch { /* subscriber gone */ }
  }
}

/** Remove rooms inactive for more than 2 hours */
function cleanupExpired(): void {
  const now = Date.now();
  for (const [id, room] of rooms) {
    if (now - room.lastActivityAt > ROOM_TTL_MS) {
      rooms.delete(id);
    }
  }
}

function touch(room: RoomState): void {
  room.lastActivityAt = Date.now();
}

function getRoom(roomId: string): RoomState {
  let room = rooms.get(roomId);
  if (!room) {
    const now = Date.now();
    room = {
      state: { ...INITIAL_GRID_STATE, votes: [], participants: {}, names: {} },
      emojiCategory: pickRandomCategory(),
      createdAt: now,
      lastActivityAt: now,
    };
    rooms.set(roomId, room);
  }
  return room;
}

function computePhase(state: GridState): GridState {
  if (!state.votingStartedAt) return state;

  const elapsed = Date.now() - state.votingStartedAt;
  if (elapsed >= VOTING_DURATION_MS && state.phase === 'voting') {
    return { ...state, phase: 'revealed' };
  }
  return state;
}

export function mergeClientData(
  roomId: string,
  data: {
    participants?: Record<string, string>;
    votingStartedAt?: number | null;
    votes?: Vote[];
  }
): void {
  const room = getRoom(roomId);

  const clientRound = data.votingStartedAt || 0;
  const serverRound = room.state.votingStartedAt || 0;

  if (clientRound > serverRound) {
    room.state = {
      ...room.state,
      votingStartedAt: data.votingStartedAt!,
      phase: 'voting',
      votes: data.votes || room.state.votes,
    };
  }

  if (data.participants) {
    room.state = {
      ...room.state,
      participants: { ...room.state.participants, ...data.participants },
    };
  }

  touch(room);
  notify(roomId);
}

export function getState(roomId: string): GridState {
  const room = getRoom(roomId);
  room.state = computePhase(room.state);
  return room.state;
}

export function joinRoom(
  roomId: string,
  participantId: string,
  name?: string,
  preferredEmoji?: string
): { emoji: string; state: GridState } {
  const room = getRoom(roomId);

  let emoji = room.state.participants[participantId];
  if (!emoji && preferredEmoji) {
    emoji = preferredEmoji;
  }
  if (!emoji) {
    const takenEmojis = Object.values(room.state.participants);
    emoji = getRandomEmoji(room.emojiCategory, takenEmojis);
  }

  room.state = {
    ...room.state,
    participants: { ...room.state.participants, [participantId]: emoji },
    names: name
      ? { ...room.state.names, [participantId]: name }
      : room.state.names,
  };
  touch(room);
  notify(roomId);
  return { emoji, state: room.state };
}

export function setName(roomId: string, participantId: string, name: string): GridState {
  const room = getRoom(roomId);
  room.state = {
    ...room.state,
    names: { ...room.state.names, [participantId]: name },
  };
  touch(room);
  notify(roomId);
  return room.state;
}

export function vote(roomId: string, v: Vote, votingStartedAt?: number): GridState {
  const room = getRoom(roomId);

  if (votingStartedAt) {
    const serverRound = room.state.votingStartedAt || 0;
    if (votingStartedAt > serverRound) {
      room.state = { ...room.state, votingStartedAt, phase: 'voting' };
    }
  }

  room.state = computePhase(room.state);
  if (room.state.phase !== 'voting') return room.state;

  room.state = {
    ...room.state,
    votes: [...room.state.votes.filter((e) => e.participantId !== v.participantId), v],
  };
  touch(room);
  notify(roomId);
  return room.state;
}

export function startVoting(roomId: string): GridState {
  const room = getRoom(roomId);

  room.state = {
    ...room.state,
    votes: [],
    phase: 'voting',
    votingStartedAt: Date.now(),
  };

  touch(room);
  notify(roomId);
  return room.state;
}

export function roomExists(roomId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;
  if (Date.now() - room.lastActivityAt > ROOM_TTL_MS) {
    rooms.delete(roomId);
    return false;
  }
  return true;
}

export function createRoom(roomId: string, adminId: string): void {
  // Cleanup expired rooms on every create
  cleanupExpired();
  const room = getRoom(roomId);
  room.state = { ...room.state, adminId };
}
