export const GRID_VALUES = ['1', '2', '3', '5', '∞', '?'] as const;

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
  'e': '∞',
  'q': '?',
};

/**
 * Place emoji in a 3x3 sub-grid within the cell based on the participant's
 * legend index (0–8). Each cell is divided into 9 equal sub-cells.
 */
export function cellPosition(
  cell: GridValue,
  participantIndex: number,
): { x: number; y: number } {
  const cellIndex = GRID_VALUES.indexOf(cell);
  const gridCols = 3;
  const gridRows = Math.ceil(GRID_VALUES.length / gridCols);
  const col = cellIndex % gridCols;
  const row = Math.floor(cellIndex / gridCols);

  const cellW = 100 / gridCols;
  const cellH = 100 / gridRows;

  // Sub-cell slot (0–8) in a 3x3 grid within the cell
  const slot = participantIndex % 9;
  const subCol = slot % 3;
  const subRow = Math.floor(slot / 3);

  // Position within the sub-grid, inset 15% from cell edges
  const inset = 0.15;
  const x = col * cellW + cellW * (inset + (1 - 2 * inset) * (subCol / 2));
  const y = row * cellH + cellH * (inset + (1 - 2 * inset) * (subRow / 2));

  return { x, y };
}
