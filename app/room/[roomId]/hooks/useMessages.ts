'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from '../../../../types';
import { mapMessage } from '../utils/mapMessage';

export function useMessages(
  token: string | null,
  roomId: string,
  currentUser: { id: string; username: string } | null,
  sendWsMessage: (type: string, payload: Record<string, any>) => void,
  wsRef: React.MutableRefObject<WebSocket | null>
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [inputValue, setInputValue] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Mark messages as seen
  const markMessagesSeen = useCallback(
    (msgs: Message[]) => {
      if (!currentUser || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      const unseenIds = msgs
        .filter((m) => m.senderId !== currentUser.id && !m.isDeleted)
        .map((m) => m.id);
      if (unseenIds.length > 0) {
        sendWsMessage('mark_seen', { roomId, messageIds: unseenIds });
      }
    },
    [currentUser, roomId, sendWsMessage, wsRef]
  );

  // Fetch initial messages
  useEffect(() => {
    if (!token) return;
    fetch(`/api/messages/${roomId}?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const rawMsgs = Array.isArray(data) ? data : data.messages || [];
        const msgs: Message[] = rawMsgs.map(mapMessage).reverse();
        setMessages(msgs);
        setHasMore(rawMsgs.length >= 50);
        markMessagesSeen(msgs);
      })
      .catch(() => {});
  }, [token, roomId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WS event handlers

  const handleNewMessage = useCallback(
    (data: any) => {
      const msg: Message = data.message || data;
      setMessages((prev) => [...prev, msg]);
      // Mark as seen if not own message
      if (currentUser && msg.senderId !== currentUser.id) {
        sendWsMessage('mark_seen', { roomId, messageIds: [msg.id] });
        // Browser notification if tab hidden
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(`${msg.senderUsername}`, { body: msg.content });
        }
      }
    },
    [currentUser, roomId, sendWsMessage]
  );

  const handleEditMessage = useCallback((data: any) => {
    const { messageId, content } = data;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, content, isEdited: true } : m
      )
    );
  }, []);

  const handleDeleteMessage = useCallback((data: any) => {
    const { messageId } = data;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, isDeleted: true, content: '[message deleted]' } : m
      )
    );
  }, []);

  const handleReadReceipt = useCallback((data: any) => {
    const { userId, username, messageIds, status } = data;
    setMessages((prev) =>
      prev.map((m) => {
        if (messageIds && messageIds.includes(m.id)) {
          const existing = m.readReceipts || [];
          const filtered = existing.filter((r) => r.userId !== userId);
          return {
            ...m,
            readReceipts: [...filtered, { userId, username, status: status || 'seen' }],
          };
        }
        return m;
      })
    );
  }, []);

  const handlePinMessageEvent = useCallback((data: any) => {
    const { messageId, pinnedBy } = data;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, isPinned: true, pinnedAt: new Date().toISOString() } : m
      )
    );
  }, []);

  const handleUnpinMessageEvent = useCallback((data: any) => {
    const { messageId } = data;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, isPinned: false, pinnedAt: undefined, pinnedById: undefined } : m
      )
    );
  }, []);

  // User actions

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    if (editingMessageId) {
      sendWsMessage('edit_message', { messageId: editingMessageId, content: inputValue.trim() });
      setEditingMessageId(null);
    } else {
      sendWsMessage('message', { roomId, content: inputValue.trim() });
    }
    setInputValue('');
  }

  function handleEdit(msg: Message) {
    setEditingMessageId(msg.id);
    setInputValue(msg.content);
  }

  function cancelEdit() {
    setEditingMessageId(null);
    setInputValue('');
  }

  function handleDelete(msgId: string) {
    sendWsMessage('delete_message', { messageId: msgId });
  }

  function handlePin(msgId: string) {
    sendWsMessage('pin_message', { messageId: msgId });
  }

  function handleUnpin(msgId: string) {
    sendWsMessage('unpin_message', { messageId: msgId });
  }

  async function loadMore() {
    if (!token || messages.length === 0 || loadingMore) return;
    setLoadingMore(true);
    const oldestId = messages[0].id;
    try {
      const res = await fetch(`/api/messages/${roomId}?cursor=${oldestId}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const rawOlder = Array.isArray(data) ? data : data.messages || [];
      const olderMsgs: Message[] = rawOlder.map(mapMessage).reverse();
      if (rawOlder.length < 50) setHasMore(false);
      if (olderMsgs.length > 0) {
        setMessages((prev) => [...olderMsgs, ...prev]);
      } else {
        setHasMore(false);
      }
    } catch {}
    setLoadingMore(false);
  }

  // Search 

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchInput.trim() || !token) return;
    setIsSearching(true);
    setSearchQuery(searchInput.trim());
    try {
      const res = await fetch(`/api/messages/${roomId}?search=${encodeURIComponent(searchInput.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const rawResults = Array.isArray(data) ? data : data.messages || [];
      const results: Message[] = rawResults.map(mapMessage).reverse();
      setMessages(results);
      setHasMore(false);
    } catch {}
  }

  function clearSearch() {
    setIsSearching(false);
    setSearchQuery('');
    setSearchInput('');
    // Reload messages
    if (!token) return;
    fetch(`/api/messages/${roomId}?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const rawMsgs = Array.isArray(data) ? data : data.messages || [];
        const msgs: Message[] = rawMsgs.map(mapMessage).reverse();
        setMessages(msgs);
        setHasMore(rawMsgs.length >= 50);
      })
      .catch(() => {});
  }

  //Receipt status helper

  function getReceiptStatus(msg: Message): string {
    if (!msg.readReceipts || msg.readReceipts.length === 0) return 'Sent';
    const hasSeenByOther = msg.readReceipts.some(
      (r) => r.status.toUpperCase() === 'SEEN' && r.userId !== currentUser?.id
    );
    if (hasSeenByOther) return 'Seen';
    const hasDelivered = msg.readReceipts.some(
      (r) => r.status.toUpperCase() === 'DELIVERED' && r.userId !== currentUser?.id
    );
    if (hasDelivered) return 'Delivered';
    return 'Sent';
  }

  return {
    messages,
    hasMore,
    loadingMore,
    inputValue,
    setInputValue,
    editingMessageId,
    handleSend,
    handleEdit,
    cancelEdit,
    handleDelete,
    loadMore,
    isSearching,
    searchQuery,
    searchInput,
    setSearchInput,
    handleSearch,
    clearSearch,
    handleNewMessage,
    handleEditMessage,
    handleDeleteMessage,
    handleReadReceipt,
    handlePinMessageEvent,
    handleUnpinMessageEvent,
    handlePin,
    handleUnpin,
    getReceiptStatus,
    messagesEndRef,
    messagesContainerRef,
  };
}
