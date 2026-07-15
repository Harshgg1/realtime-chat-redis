import { Message } from '../../../../types';

export function mapMessage(m: any): Message {
  return {
    id: m.id,
    content: m.content,
    senderId: m.senderId || m.sender?.id,
    senderUsername: m.senderUsername || m.sender?.username || 'Unknown',
    createdAt: m.createdAt,
    isEdited: m.isEdited,
    isDeleted: m.isDeleted,
    isPinned: m.isPinned,
    pinnedAt: m.pinnedAt,
    pinnedById: m.pinnedById,
    readReceipts: (m.readReceipts || []).map((r: any) => ({
      userId: r.userId || r.user?.id,
      username: r.username || r.user?.username || 'Unknown',
      status: r.status,
    })),
  };
}
