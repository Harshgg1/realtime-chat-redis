import { Router } from 'express';
import prisma from '../config/prisma.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

// Get pinned messages for a room
router.get('/:roomId/pinned', async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await prisma.message.findMany({
      where: { roomId, isPinned: true, isDeleted: false },
      orderBy: { pinnedAt: 'desc' },
      include: {
        sender: { select: { id: true, username: true } },
      },
    });
    res.json({ messages });
  } catch (error) {
    console.error('Get pinned messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a room with pagination
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { cursor, limit: limitStr, search } = req.query;
    const limit = parseInt(limitStr as string) || 50;

    const where: any = { roomId };

    if (search) {
      where.content = { contains: search as string, mode: 'insensitive' };
    }

    const findArgs: any = {
      where,
      take: limit,
      orderBy: { createdAt: 'desc' as const },
      include: {
        sender: { select: { id: true, username: true } },
        readReceipts: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    };

    if (cursor) {
      findArgs.cursor = { id: cursor as string };
      findArgs.skip = 1; // skip the cursor item itself
    }

    const messages = await prisma.message.findMany(findArgs);

    const nextCursor = messages.length === limit ? messages[messages.length - 1]?.id : null;

    res.json({ messages, nextCursor });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Edit message
router.put('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user!.userId;

    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    if (message.senderId !== userId) {
      res.status(403).json({ error: 'Only the sender can edit this message' });
      return;
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { content, isEdited: true },
      include: { sender: { select: { id: true, username: true } } },
    });

    res.json({ message: updated });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete message (soft delete)
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user!.userId;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { room: true },
    });

    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    // Sender or room admin can delete
    if (message.senderId !== userId && message.room.adminId !== userId) {
      res.status(403).json({ error: 'Not authorized to delete this message' });
      return;
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });

    res.json({ message: updated });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
