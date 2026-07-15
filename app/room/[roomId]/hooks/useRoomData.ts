'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Member } from '../../../../types';

export function useRoomData(token: string | null, roomId: string) {
  const router = useRouter();
  const [roomName, setRoomName] = useState('');
  const [adminId, setAdminId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  // Fetch room info
  useEffect(() => {
    if (!token) return;
    fetch(`/api/rooms/${roomId}`, {
      headers: { Authorization: `Bearer ${token}` }, 
    })
      .then((res) => res.json())
      .then((data) => {
        const roomData = data.room || data;
        setRoomName(roomData.name || roomId);
        if (roomData.adminId) setAdminId(roomData.adminId);
      })
      .catch(() => {});
  }, [token, roomId]);

  // Fetch members
  useEffect(() => {
    if (!token) return;
    fetch(`/api/rooms/${roomId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const rawMembers = Array.isArray(data) ? data : data.members || [];
        const membersList = rawMembers.map((m: any) => ({
          id: m.user?.id || m.id,
          username: m.user?.username || m.username,
          online: (m.user?.status || m.status || '').toUpperCase() === 'ONLINE',
          lastSeen: m.user?.lastSeen || m.lastSeen,
        }));
        setMembers(membersList);
      })
      .catch(() => {});
  }, [token, roomId]);

  // Handle presence WS event
  const handlePresence = useCallback((data: any) => {
    const { userId, username, status, lastSeen } = data;
    const isOnline = (status || '').toUpperCase() === 'ONLINE';
    setMembers((prev) => {
      const exists = prev.find((m) => m.id === userId);
      if (exists) {
        return prev.map((m) =>
          m.id === userId
            ? { ...m, online: isOnline, lastSeen: lastSeen || m.lastSeen }
            : m
        );
      }
      return [...prev, { id: userId, username, online: isOnline, lastSeen }];
    });
  }, []);

  // Leave room
  const handleLeave = useCallback(async () => {
    if (!token) return;
    try {
      await fetch(`/api/rooms/${roomId}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    router.push('/');
  }, [token, roomId, router]);

  return { roomName, members, adminId, handlePresence, handleLeave };
}
