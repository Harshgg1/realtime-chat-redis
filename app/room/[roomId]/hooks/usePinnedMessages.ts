'use client';

import { useState, useEffect, useCallback } from 'react';
import { Message } from '../../../../types';
import { mapMessage } from '../utils/mapMessage';

export function usePinnedMessages(token: string | null, roomId: string) {
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);

  // Fetch initial pinned messages
  useEffect(() => {
    if (!token) return;
    fetch(`/api/messages/${roomId}/pinned`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const rawMsgs = Array.isArray(data) ? data : data.messages || [];
        const msgs: Message[] = rawMsgs.map(mapMessage);
        setPinnedMessages(msgs);
      })
      .catch(() => {});
  }, [token, roomId]);

  // Handle WS events for pins
  const handlePinEvent = useCallback((data: any) => {
    // If we receive a pin event, we reload the pinned list from the server to get the full message object.
    if (!token) return;
    fetch(`/api/messages/${roomId}/pinned`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const rawMsgs = Array.isArray(data) ? data : data.messages || [];
        const msgs: Message[] = rawMsgs.map(mapMessage);
        setPinnedMessages(msgs);
      })
      .catch(() => {});
  }, [token, roomId]);

  return {
    pinnedMessages,
    isPinnedOpen,
    setIsPinnedOpen,
    handlePinEvent,
  };
}
