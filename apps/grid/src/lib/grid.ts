export const GRID_VALUES = ['1', '2', '3', '5', '8', '13', '21', '∞', '?'] as const;

export type GridValue = (typeof GRID_VALUES)[number];

export type Vote = {
  participantId: string;
  emoji: string;
  cell: GridValue;
  x: number;
  y: number;
};

export type Phase = 'waiting' | 'voting' | 'revealed';

export type GridState = {
  votes: Vote[];
  phase: Phase;
  adminId: string | null;
  votingStartedAt: number | null;
  /** participantId -> emoji */
  participants: Record<string, string>;
  /** participantId -> display name */
  names: Record<string, string>;
};

export const INITIAL_GRID_STATE: GridState = {
  votes: [],
  phase: 'waiting',
  adminId: null,
  votingStartedAt: null,
  participants: {},
  names: {},
};

export const VOTING_DURATION_MS = 5000;
