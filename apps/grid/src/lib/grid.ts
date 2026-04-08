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

/** Key → GridValue mapping for keyboard shortcuts */
export const KEY_TO_CELL: Record<string, GridValue> = {
  '1': '1',
  '2': '2',
  '3': '3',
  '5': '5',
  '8': '8',
  '=': '∞',
  '?': '?',
};

/** GridValue → center position (percentage) in the 3x3 grid */
export function cellCenter(cell: GridValue): { x: number; y: number } {
  const index = GRID_VALUES.indexOf(cell);
  const col = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: (col + 0.5) * (100 / 3),
    y: (row + 0.5) * (100 / 3),
  };
}
