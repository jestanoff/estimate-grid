import { GridState, Vote, INITIAL_GRID_STATE, VOTING_DURATION_MS } from './grid';
import { getRandomEmoji, pickRandomCategory, type EmojiCategory } from './emojis';

type RoomState = {
  state: GridState;
  emojiCategory: EmojiCategory;
};

const rooms = new Map<string, RoomState>();

function getRoom(roomId: string): RoomState {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      state: { ...INITIAL_GRID_STATE, votes: [], participants: {}, names: {} },
      emojiCategory: pickRandomCategory(),
    };
    rooms.set(roomId, room);
  }
  return room;
}

/**
 * Compute the current phase from votingStartedAt.
 * No timers needed — purely derived from the timestamp.
 */
function computePhase(state: GridState): GridState {
  if (!state.votingStartedAt) return state;

  const elapsed = Date.now() - state.votingStartedAt;
  if (elapsed >= VOTING_DURATION_MS && state.phase === 'voting') {
    return { ...state, phase: 'revealed' };
  }
  return state;
}

/**
 * Merge client-known data into the server's room state.
 * This ensures fresh serverless instances learn about active rounds and participants.
 */
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

  // If the client knows about a newer round, adopt it
  if (clientRound > serverRound) {
    room.state = {
      ...room.state,
      votingStartedAt: data.votingStartedAt!,
      phase: 'voting',
      votes: data.votes || room.state.votes,
    };
  }

  // Always merge participants/names
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
  // Always compute phase from time before returning
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

  // If this instance doesn't know about the round, trust the client
  if (votingStartedAt) {
    const serverRound = room.state.votingStartedAt || 0;
    if (votingStartedAt > serverRound) {
      room.state = { ...room.state, votingStartedAt, phase: 'voting' };
    }
  }

  // Compute phase from time
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
  return rooms.has(roomId);
}

export function createRoom(roomId: string, adminId: string): void {
  const room = getRoom(roomId);
  room.state = { ...room.state, adminId };
}
