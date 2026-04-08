'use client';

import { useEffect, useState, useCallback } from 'react';

export type Participant = {
  id: string;
  emoji: string;
  name: string;
  isAdmin: boolean;
};

type RoomData = {
  emoji: string;
  isAdmin: boolean;
};

function getRoomData(roomId: string): RoomData | null {
  try {
    const stored = localStorage.getItem(`grid-room-${roomId}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setRoomData(roomId: string, data: RoomData): void {
  localStorage.setItem(`grid-room-${roomId}`, JSON.stringify(data));
}

export function markAsAdmin(roomId: string): void {
  const existing = getRoomData(roomId);
  setRoomData(roomId, { emoji: existing?.emoji || '', isAdmin: true });
}

export function useParticipant(roomId: string): {
  participant: Participant | null;
  setName: (name: string) => Promise<void>;
} {
  const [participant, setParticipant] = useState<Participant | null>(null);

  useEffect(() => {
    let id = localStorage.getItem('grid-participant-id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('grid-participant-id', id);
    }

    const storedName = localStorage.getItem('grid-participant-name') || '';
    const roomData = getRoomData(roomId);

    fetch(`/api/room/${roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId: id,
        name: storedName || undefined,
        emoji: roomData?.emoji || undefined,
      }),
    })
      .then((res) => {
        if (res.status === 404) {
          window.location.href = '/';
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        const { emoji } = data;
        // Persist the emoji the server gave us (or confirmed)
        setRoomData(roomId, {
          emoji,
          isAdmin: roomData?.isAdmin || false,
        });
        setParticipant({
          id: id!,
          emoji,
          name: storedName,
          isAdmin: roomData?.isAdmin || false,
        });
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
