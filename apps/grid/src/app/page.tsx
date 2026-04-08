'use client';

import { useState } from 'react';
import { markAsAdmin } from '@/lib/useParticipant';
import { KaluzaLogo } from '@/components/KaluzaLogo';
import styles from './page.module.css';

function getOrCreateParticipantId(): string {
  let id = localStorage.getItem('grid-participant-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('grid-participant-id', id);
  }
  return id;
}

export default function Home() {
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    const adminId = getOrCreateParticipantId();
    const res = await fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId }),
    });
    const { roomId } = await res.json();
    markAsAdmin(roomId);
    window.location.href = `/${roomId}`;
  }

  return (
    <main className={styles.main}>
      <div className={styles.logo}>
        <KaluzaLogo />
      </div>
      <h1 className={styles.title}>GRID</h1>
      <p className={styles.subtitle}>
        A collaborative planning and voting tool for teams.
      </p>
      <button className={styles.button} onClick={handleCreate} disabled={loading}>
        {loading ? 'Creating...' : 'Create new voting grid'}
      </button>
    </main>
  );
}
