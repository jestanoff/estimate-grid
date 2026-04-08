import { GridState, Vote, INITIAL_GRID_STATE, VOTING_DURATION_MS } from './grid';
import { getRandomEmoji, pickRandomCategory, type EmojiCategory } from './emojis';

type RoomState = {
  state: GridState;
  emojiCategory: EmojiCategory;
  revealTimer: ReturnType<typeof setTimeout> | null;
};

const rooms = new Map<string, RoomState>();

function getRoom(roomId: string): RoomState {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      state: { ...INITIAL_GRID_STATE, votes: [], participants: {}, names: {} },
      emojiCategory: pickRandomCategory(),
      revealTimer: null,
    };
    rooms.set(roomId, room);
  }
  return room;
}

/**
 * Merge client-known participants/names into the server's room state.
 * This ensures that even if a serverless instance is fresh, it learns
 * about all participants from the client's request.
 */
export function mergeParticipants(
  roomId: string,
  participants: Record<string, string>,
  names: Record<string, string>
): void {
  const room = getRoom(roomId);
  room.state = {
    ...room.state,
    participants: { ...room.state.participants, ...participants },
    names: { ...room.state.names, ...names },
  };
}

export function getState(roomId: string): GridState {
  return getRoom(roomId).state;
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

  // If this instance doesn't know about voting, but the client says it's active, trust it
  if (room.state.phase !== 'voting' && votingStartedAt) {
    const elapsed = Date.now() - votingStartedAt;
    if (elapsed < VOTING_DURATION_MS) {
      room.state = { ...room.state, phase: 'voting', votingStartedAt };
      scheduleReveal(room);
    }
  }

  if (room.state.phase !== 'voting') return room.state;

  room.state = {
    ...room.state,
    votes: [...room.state.votes.filter((e) => e.participantId !== v.participantId), v],
  };
  return room.state;
}

export function startVoting(roomId: string): GridState {
  const room = getRoom(roomId);

  if (room.revealTimer) clearTimeout(room.revealTimer);

  room.state = {
    ...room.state,
    votes: [],
    phase: 'voting',
    votingStartedAt: Date.now(),
  };

  scheduleReveal(room);
  return room.state;
}

function scheduleReveal(room: RoomState) {
  if (room.revealTimer) clearTimeout(room.revealTimer);

  const elapsed = Date.now() - (room.state.votingStartedAt || Date.now());
  const remaining = Math.max(0, VOTING_DURATION_MS - elapsed);

  room.revealTimer = setTimeout(() => {
    room.state = { ...room.state, phase: 'revealed' };
    room.revealTimer = null;
  }, remaining);
}

export function roomExists(roomId: string): boolean {
  return rooms.has(roomId);
}

export function createRoom(roomId: string, adminId: string): void {
  const room = getRoom(roomId);
  room.state = { ...room.state, adminId };
}
