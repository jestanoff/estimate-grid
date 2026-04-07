'use client';

import { useEffect, useState, useCallback } from 'react';

export type Participant = {
  id: string;
  emoji: string;
  name: string;
};

export function useParticipant(roomId: string): {
  participant: Participant | null;
  setName: (name: string) => Promise<void>;
} {
  const [participant, setParticipant] = useState<Participant | null>(null);

  useEffect(() => {
    let id = sessionStorage.getItem('grid-participant-id');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('grid-participant-id', id);
    }

    const storedName = localStorage.getItem('grid-participant-name') || '';

    fetch(`/api/room/${roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: id, name: storedName || undefined }),
    })
      .then((res) => res.json())
      .then(({ emoji }) => {
        setParticipant({ id: id!, emoji, name: storedName });
      });
  }, [roomId]);

  const updateName = useCallback(
    async (name: string) => {
      if (!participant) return;

      localStorage.setItem('grid-participant-name', name);
      setParticipant((prev) => (prev ? { ...prev, name } : prev));

      await fetch(`/api/room/${roomId}/name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: participant.id, name }),
      });
    },
    [participant, roomId]
  );

  return { participant, setName: updateName };
}
