import { GridState, Vote, INITIAL_GRID_STATE, VOTING_DURATION_MS } from './grid';
import { getRandomEmoji, pickRandomCategory, type EmojiCategory } from './emojis';

const ROOM_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type RoomState = {
  state: GridState;
  emojiCategory: EmojiCategory;
  createdAt: number;
};

const rooms = new Map<string, RoomState>();

/** Remove rooms older than 24 hours */
function cleanupExpired(): void {
  const now = Date.now();
  for (const [id, room] of rooms) {
    if (now - room.createdAt > ROOM_TTL_MS) {
      rooms.delete(id);
    }
  }
}

function getRoom(roomId: string): RoomState {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      state: { ...INITIAL_GRID_STATE, votes: [], participants: {}, names: {} },
      emojiCategory: pickRandomCategory(),
      createdAt: Date.now(),
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
    names?: Record<string, string>;
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
  if (data.names) {
    room.state = {
      ...room.state,
      names: { ...room.state.names, ...data.names },
    };
  }
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
  return { emoji, state: room.state };
}

export function setName(roomId: string, participantId: string, name: string): GridState {
  const room = getRoom(roomId);
  room.state = {
    ...room.state,
    names: { ...room.state.names, [participantId]: name },
  };
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

  return room.state;
}

export function roomExists(roomId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;
  // Expired rooms don't count
  if (Date.now() - room.createdAt > ROOM_TTL_MS) {
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
