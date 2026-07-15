import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'url';
import prisma from '../config/prisma.js';
import { verifyToken } from '../auth.js';
import RedisSubscriptionManager from '../services/RedisSubscriptionManager.js';

interface ExtWebSocket extends WebSocket {
  userId: string;
  username: string;
  isAlive: boolean;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimits = new Map<string, TokenBucket>();
const MAX_TOKENS = 10;
const REFILL_RATE = 1; // tokens per second

function consumeToken(userId: string): boolean {
  const now = Date.now();
  let bucket = rateLimits.get(userId);

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
    rateLimits.set(userId, bucket);
  }

  // Refill tokens
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + elapsed * REFILL_RATE);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    return false;
  }

  bucket.tokens -= 1;
  return true;
}

export function setupWebSocket(server: http.Server): void {
  const wss = new WebSocketServer({ server });
  const manager = RedisSubscriptionManager.getInstance();

  // Heartbeat interval
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      const extWs = ws as ExtWebSocket;
      if (!extWs.isAlive) {
        extWs.terminate();
        return;
      }
      extWs.isAlive = false;
      extWs.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    const extWs = ws as ExtWebSocket;

    // Extract token from query params
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'No token provided');
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      ws.close(4001, 'Invalid token');
      return;
    }

    extWs.userId = decoded.userId;
    extWs.username = decoded.username;
    extWs.isAlive = true;

    // Pong handler
    extWs.on('pong', () => {
      extWs.isAlive = true;
    });

    console.log(`[WS] User connected: ${extWs.username} (${extWs.userId})`);

    extWs.on('message', async (data: Buffer) => {
      try {
        // Rate limiting
        if (!consumeToken(extWs.userId)) {
          extWs.send(JSON.stringify({ type: 'error', message: 'Rate limit exceeded. Please slow down.' }));
          return;
        }

        const parsed = JSON.parse(data.toString());
        const { type, payload } = parsed;
        // Support both { type, payload: { roomId } } and { type, roomId } formats
        const p = payload || parsed;

        switch (type) {
          case 'join_room': {
            const { roomId } = p;
            await manager.subscribe(extWs.userId, roomId, extWs);

            // Update user status
            await prisma.user.update({
              where: { id: extWs.userId },
              data: { status: 'ONLINE' },
            });

            // Broadcast presence
            await manager.publish(roomId, {
              type: 'presence',
              userId: extWs.userId,
              username: extWs.username,
              status: 'ONLINE',
              roomId,
            });

            extWs.send(JSON.stringify({ type: 'joined_room', roomId }));
            break;
          }

          case 'leave_room': {
            const { roomId } = p; 
            await manager.unsubscribe(extWs.userId, roomId);

            // Broadcast presence
            await manager.publish(roomId, {
              type: 'presence',
              userId: extWs.userId,
              username: extWs.username,
              status: 'LEFT',
              roomId,
            });

            extWs.send(JSON.stringify({ type: 'left_room', roomId }));
            break;
          }

          case 'message': {
            const { roomId, content } = p;

            if (!content || !roomId) {
              extWs.send(JSON.stringify({ type: 'error', message: 'roomId and content are required' }));
              return;
            }

            // Save message to DB
            const message = await prisma.message.create({
              data: {
                roomId,
                senderId: extWs.userId,
                content,
                readReceipts: {
                  create: { userId: extWs.userId, status: 'SENT' },
                },
              },
              include: {
                sender: { select: { id: true, username: true } },
              },
            });

            // Publish to Redis
            await manager.publish(roomId, {
              type: 'new_message',
              message: {
                id: message.id,
                content: message.content,
                senderId: message.senderId,
                senderUsername: message.sender.username,
                roomId: message.roomId,
                createdAt: message.createdAt,
              },
            });
            break;
          }

          case 'typing': {
            const { roomId, isTyping } = p;
            await manager.publish(roomId, {
              type: 'typing',
              userId: extWs.userId,
              username: extWs.username,
              roomId,
              isTyping,
            });
            break;
          }

          case 'edit_message': {
            const { messageId, content } = p;

            const message = await prisma.message.findUnique({ where: { id: messageId } });
            if (!message || message.senderId !== extWs.userId) {
              extWs.send(JSON.stringify({ type: 'error', message: 'Cannot edit this message' }));
              return;
            }

            await prisma.message.update({
              where: { id: messageId },
              data: { content, isEdited: true },
            });

            await manager.publish(message.roomId, {
              type: 'message_edited',
              messageId,
              content,
              roomId: message.roomId,
            });
            break;
          }

          case 'delete_message': {
            const { messageId } = p;

            const message = await prisma.message.findUnique({
              where: { id: messageId },
              include: { room: true },
            });

            if (!message) {
              extWs.send(JSON.stringify({ type: 'error', message: 'Message not found' }));
              return;
            }

            if (message.senderId !== extWs.userId && message.room.adminId !== extWs.userId) {
              extWs.send(JSON.stringify({ type: 'error', message: 'Not authorized to delete' }));
              return;
            }

            await prisma.message.update({
              where: { id: messageId },
              data: { isDeleted: true },
            });

            await manager.publish(message.roomId, {
              type: 'message_deleted',
              messageId,
              roomId: message.roomId,
            });
            break;
          }

          case 'pin_message': {
            const { messageId } = p;
            const message = await prisma.message.findUnique({
              where: { id: messageId },
              include: { room: true },
            });
            if (!message) {
              extWs.send(JSON.stringify({ type: 'error', message: 'Message not found' }));
              return;
            }
            if (message.room.adminId !== extWs.userId) {
              extWs.send(JSON.stringify({ type: 'error', message: 'Only room admin can pin messages' }));
              return;
            }
            const pinnedCount = await prisma.message.count({
              where: { roomId: message.roomId, isPinned: true, isDeleted: false },
            });
            if (pinnedCount >= 10) {
              extWs.send(JSON.stringify({ type: 'error', message: 'Maximum of 10 pinned messages allowed' }));
              return;
            }
            await prisma.message.update({
              where: { id: messageId },
              data: { isPinned: true, pinnedAt: new Date(), pinnedById: extWs.userId },
            });
            await manager.publish(message.roomId, {
              type: 'message_pinned',
              messageId,
              roomId: message.roomId,
              pinnedBy: extWs.username,
            });
            break;
          }

          case 'unpin_message': {
            const { messageId } = p;
            const message = await prisma.message.findUnique({
              where: { id: messageId },
              include: { room: true },
            });
            if (!message) {
              extWs.send(JSON.stringify({ type: 'error', message: 'Message not found' }));
              return;
            }
            if (message.room.adminId !== extWs.userId) {
              extWs.send(JSON.stringify({ type: 'error', message: 'Only room admin can unpin messages' }));
              return;
            }
            await prisma.message.update({
              where: { id: messageId },
              data: { isPinned: false, pinnedAt: null, pinnedById: null },
            });
            await manager.publish(message.roomId, {
              type: 'message_unpinned',
              messageId,
              roomId: message.roomId,
            });
            break;
          }

          case 'mark_seen': {
            const { roomId, messageIds } = p;

            if (!messageIds || !Array.isArray(messageIds)) return;

            // Upsert read receipts
            for (const msgId of messageIds) {
              await prisma.readReceipt.upsert({
                where: { messageId_userId: { messageId: msgId, userId: extWs.userId } },
                update: { status: 'SEEN' },
                create: { messageId: msgId, userId: extWs.userId, status: 'SEEN' },
              });
            }

            await manager.publish(roomId, {
              type: 'read_receipt',
              userId: extWs.userId,
              username: extWs.username,
              roomId,
              messageIds,
              status: 'SEEN',
            });
            break;
          }

          default:
            extWs.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${type}` }));
        }
      } catch (error) {
        console.error('[WS] Error handling message:', error);
        extWs.send(JSON.stringify({ type: 'error', message: 'Internal server error' }));
      }
    });

    extWs.on('close', async () => {
      console.log(`[WS] User disconnected: ${extWs.username} (${extWs.userId})`);

      // Get rooms before removing
      const userRooms = manager.getUserRooms(extWs.userId);

      // Remove user from all rooms
      await manager.removeUser(extWs.userId);

      // Update user status
      try {
        await prisma.user.update({
          where: { id: extWs.userId },
          data: { status: 'OFFLINE', lastSeen: new Date() },
        });
      } catch {}

      // Broadcast offline presence to all rooms
      for (const roomId of userRooms) {
        try {
          await manager.publish(roomId, {
            type: 'presence',
            userId: extWs.userId,
            username: extWs.username,
            status: 'OFFLINE',
            roomId,
          });
        } catch {}
      }

      // Cleanup rate limit
      rateLimits.delete(extWs.userId);
    });

    extWs.on('error', (err) => {
      console.error(`[WS] Error for user ${extWs.username}:`, err);
    });
  });

  console.log('[WS] WebSocket server initialized');
}
