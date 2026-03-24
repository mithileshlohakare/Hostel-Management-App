'use client';

import { toast } from 'sonner';

import { getWsUrl } from '@/lib/api';

export function connectRealtime(onEvent?: (event: string, payload: Record<string, unknown>) => void) {
  const socket = new WebSocket(getWsUrl());

  socket.onopen = () => {
    socket.send('ping');
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      toast.info(`Realtime: ${data.event}`);
      onEvent?.(data.event, data.payload || {});
    } catch {
      // ignore invalid payload
    }
  };

  socket.onerror = () => {
    toast.error('Realtime channel disconnected');
  };

  return socket;
}
