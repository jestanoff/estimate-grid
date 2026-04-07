import { GridState, Vote, INITIAL_GRID_STATE, VOTING_DURATION_MS } from './grid';
import { getRandomEmoji, pickRandomCategory, type EmojiCategory } from './emojis';

type RoomState = {
  state: GridState;
  emojiCategory: EmojiCategory;
  listeners: Set<(state: GridState) => void>;
  revealTimer: ReturnType<typeof setTimeout> | null;
};

const rooms = new Map<string, RoomState>();

function getRoom(roomId: string): RoomState {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      state: { ...INITIAL_GRID_STATE, votes: [], participants: {}, names: {} },
      emojiCategory: pickRandomCategory(),
      listeners: new Set(),
      revealTimer: null,
    };
    rooms.set(roomId, room);
  }
  return room;
}

export function getState(roomId: string): GridState {
  return getRoom(roomId).state;
}

export function joinRoom(
  roomId: string,
  participantId: string,
  name?: string
): { emoji: string; state: GridState } {
  const room = getRoom(roomId);

  let emoji = room.state.participants[participantId];
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
  notify(room);
  return { emoji, state: room.state };
}

export function setName(roomId: string, participantId: string, name: string): GridState {
  const room = getRoom(roomId);
  room.state = {
    ...room.state,
    names: { ...room.state.names, [participantId]: name },
  };
  notify(room);
  return room.state;
}

export function vote(roomId: string, v: Vote): GridState {
  const room = getRoom(roomId);
  if (room.state.phase !== 'voting') return room.state;

  room.state = {
    ...room.state,
    votes: [...room.state.votes.filter((e) => e.participantId !== v.participantId), v],
  };
  notify(room);
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
  notify(room);

  room.revealTimer = setTimeout(() => {
    room.state = { ...room.state, phase: 'revealed' };
    notify(room);
    room.revealTimer = null;
  }, VOTING_DURATION_MS);

  return room.state;
}

export function subscribe(roomId: string, listener: (state: GridState) => void) {
  const room = getRoom(roomId);
  room.listeners.add(listener);
  return () => room.listeners.delete(listener);
}

export function roomExists(roomId: string): boolean {
  return rooms.has(roomId);
}

export function createRoom(roomId: string, adminId: string): void {
  const room = getRoom(roomId);
  room.state = { ...room.state, adminId };
}

function notify(room: RoomState) {
  room.listeners.forEach((fn) => fn(room.state));
}
