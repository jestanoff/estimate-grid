'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { markAsAdmin } from '@/lib/useParticipant';
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
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

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
    router.push(`/${roomId}`);
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>GRID</h1>
      <p className={styles.subtitle}>
        A collaborative planning and voting tool for teams.
      </p>
      <button className={styles.button} onClick={handleCreate} disabled={loading || !ready}>
        {loading ? 'Creating...' : 'Create new board'}
      </button>
    </main>
  );
}
