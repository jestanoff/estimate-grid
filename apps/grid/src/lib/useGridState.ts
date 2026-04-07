'use client';

import { useEffect, useState } from 'react';
import type { GridState } from './grid';
import { INITIAL_GRID_STATE } from './grid';

export function useGridState(roomId: string): GridState {
  const [state, setState] = useState<GridState>(INITIAL_GRID_STATE);

  useEffect(() => {
    const eventSource = new EventSource(`/api/room/${roomId}/events`);

    eventSource.onmessage = (event) => {
      try {
        setState(JSON.parse(event.data));
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [roomId]);

  return state;
}
