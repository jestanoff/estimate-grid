'use client';

import { GRID_VALUES, type GridValue, VOTING_DURATION_MS } from '@/lib/grid';
import { useGridState } from '@/lib/useGridState';
import { useParticipant } from '@/lib/useParticipant';
import { useRef, useState, useEffect, type MouseEvent } from 'react';
import { GridCell } from './GridCell';
import styles from './Grid.module.css';

type Props = {
  roomId: string;
};

export function Grid({ roomId }: Props) {
  const state = useGridState(roomId);
  const { participant, setName } = useParticipant(roomId);
  const gridRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [nameInput, setNameInput] = useState('');
  const [editingName, setEditingName] = useState(false);

  const myVote = participant
    ? state.votes.find((v) => v.participantId === participant.id)
    : undefined;

  const isAdmin = participant?.isAdmin ?? false;
  const isVoting = state.phase === 'voting';
  const isRevealed = state.phase === 'revealed';

  // Seed name input from participant
  useEffect(() => {
    if (participant && !participant.name) {
      setEditingName(true);
    }
    if (participant?.name) {
      setNameInput(participant.name);
    }
  }, [participant]);

  useEffect(() => {
    if (state.phase !== 'voting' || !state.votingStartedAt) {
      if (state.phase !== 'voting') setProgress(0);
      return;
    }

    const start = state.votingStartedAt;
    let raf: number;

    function tick() {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / VOTING_DURATION_MS) * 100);
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state.phase, state.votingStartedAt]);

  async function handleGridClick(e: MouseEvent<HTMLDivElement>) {
    if (!participant || !gridRef.current) return;
    if (state.phase !== 'voting') return;

    const rect = gridRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const col = Math.min(2, Math.floor((x / 100) * 3));
    const row = Math.min(2, Math.floor((y / 100) * 3));
    const cellIndex = row * 3 + col;
    const cell = GRID_VALUES[cellIndex];

    await fetch(`/api/room/${roomId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId: participant.id,
        emoji: participant.emoji,
        cell,
        x,
        y,
      }),
    });
  }

  async function handleStart() {
    if (isVoting) return;
    await fetch(`/api/room/${roomId}/start`, { method: 'POST' });
  }

  async function handleNameSubmit() {
    const trimmed = nameInput.trim();
    if (trimmed) {
      await setName(trimmed);
      setEditingName(false);
    }
  }

  const participantEntries = Object.entries(state.participants);

  return (
    <>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={styles.container}>
        <div className={styles.gridArea}>
          <div
            className={`${styles.gridWrapper} ${!isVoting ? styles.gridDisabled : ''}`}
            ref={gridRef}
            onClick={handleGridClick}
          >
            <div className={styles.grid}>
              {GRID_VALUES.map((value, i) => (
                <GridCell
                  key={value}
                  value={value}
                  isMyVote={myVote?.cell === value}
                  row={Math.floor(i / 3)}
                  col={i % 3}
                />
              ))}
            </div>

            {isVoting && myVote && (
              <span
                className={styles.placedEmoji}
                title={participant?.name || undefined}
                style={{ left: `${myVote.x}%`, top: `${myVote.y}%` }}
              >
                {myVote.emoji}
              </span>
            )}

            {isRevealed &&
              state.votes.map((v) => (
                <span
                  key={v.participantId}
                  className={styles.placedEmoji}
                  title={state.names[v.participantId] || undefined}
                  style={{ left: `${v.x}%`, top: `${v.y}%` }}
                >
                  {v.emoji}
                </span>
              ))}
          </div>
        </div>

        <div className={styles.sidebar}>
          {/* Name input */}
          {participant && editingName && (
            <div className={styles.nameForm}>
              <input
                className={styles.nameInput}
                type="text"
                placeholder="Your name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                autoFocus
              />
              <button className={styles.nameButton} onClick={handleNameSubmit}>
                OK
              </button>
            </div>
          )}

          {/* Your emoji + name */}
          {participant && !editingName && (
            <div className={styles.emojiReveal}>
              <span className={styles.myEmoji}>{participant.emoji}</span>
              <button
                className={styles.nameLabel}
                onClick={() => setEditingName(true)}
                title="Click to change name"
              >
                {participant.name || 'Set name'}
              </button>
            </div>
          )}

          {/* Participants legend */}
          {participantEntries.length > 0 && (
            <div className={styles.legend}>
              {participantEntries.map(([pid, emoji]) => (
                <div key={pid} className={styles.legendItem}>
                  <span className={styles.legendEmoji}>{emoji}</span>
                  <span className={styles.legendName}>
                    {state.names[pid] || '—'}
                    {pid === participant?.id ? ' (you)' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.info}>
            {state.votes.length} vote{state.votes.length !== 1 ? 's' : ''}
          </div>

          {/* Vote summary after reveal */}
          {isRevealed && state.votes.length > 0 && (
            <div className={styles.summary}>
              <div className={styles.summaryTitle}>Results</div>
              {GRID_VALUES
                .map((val) => ({
                  val,
                  count: state.votes.filter((v) => v.cell === val).length,
                }))
                .filter((r) => r.count > 0)
                .sort((a, b) => b.count - a.count)
                .map((r) => (
                  <div key={r.val} className={styles.summaryRow}>
                    <span className={styles.summaryValue}>{r.val}</span>
                    <span className={styles.summaryBar}>
                      <span
                        className={styles.summaryBarFill}
                        style={{
                          width: `${(r.count / state.votes.length) * 100}%`,
                        }}
                      />
                    </span>
                    <span className={styles.summaryCount}>{r.count}</span>
                  </div>
                ))}
            </div>
          )}

          {isAdmin && (
            <div className={styles.actions}>
              <button
                className={styles.button}
                onClick={handleStart}
                disabled={isVoting}
              >
                Start voting
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
