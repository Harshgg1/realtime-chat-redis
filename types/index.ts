export interface User {
  id: string;
  username: string;
}

export interface Room {
  id: string;
  name: string;
  memberCount?: number;
  createdBy?: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderUsername: string;
  createdAt: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  isPinned?: boolean;
  pinnedAt?: string;
  pinnedById?: string;
  readReceipts?: ReadReceipt[];
}

export interface ReadReceipt {
  userId: string;
  username: string;
  status: string;
}

export interface Member {
  id: string;
  username: string;
  online?: boolean;
  lastSeen?: string;
}
