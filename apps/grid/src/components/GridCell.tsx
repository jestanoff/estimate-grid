'use client';

import type { GridValue } from '@/lib/grid';
import styles from './GridCell.module.css';

type Props = {
  value: GridValue;
  isMyVote: boolean;
  row: number;
  col: number;
};

export function GridCell({ value, isMyVote, row, col }: Props) {
  const outerClasses = [
    styles.cell,
    col < 2 ? styles.borderRight : '',
    row < 1 ? styles.borderBottom : '',
  ]
    .filter(Boolean)
    .join(' ');

  const innerClasses = [
    styles.inner,
    isMyVote ? styles.selected : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={outerClasses}>
      <div className={innerClasses}>
        <span className={styles.value}>{value}</span>
      </div>
    </div>
  );
}
