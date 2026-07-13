import { createClient, RedisClientType } from 'redis';
import { WebSocket } from 'ws';

import { env } from '../env.js';
const REDIS_URL = env.REDIS_URL;

export class RedisSubscriptionManager {
  private static instance: RedisSubscriptionManager;
  private subscriber: RedisClientType;
  private publisher: RedisClientType;
  private users: Map<string, { rooms: Set<string>; ws: WebSocket }> = new Map();
  private rooms: Map<string, Set<string>> = new Map();
  private roomSubCount: Map<string, number> = new Map();
  private initialized = false;

  private constructor() {
    this.subscriber = createClient({ url: REDIS_URL }) as RedisClientType;
    this.publisher = createClient({ url: REDIS_URL }) as RedisClientType;
  }

  static getInstance(): RedisSubscriptionManager {
    if (!RedisSubscriptionManager.instance) {
      RedisSubscriptionManager.instance = new RedisSubscriptionManager();
    } 
    return RedisSubscriptionManager.instance;
  }

  async ensureConnected(): Promise<void> {
    if (this.initialized) return;
    await this.subscriber.connect();
    await this.publisher.connect();
    this.initialized = true;
    console.log('[Redis] Connected to Redis');
  }

  async subscribe(userId: string, roomId: string, ws: WebSocket): Promise<void> {
    await this.ensureConnected();

    // Track user
    let userData = this.users.get(userId);
    if (!userData) {
      userData = { rooms: new Set(), ws };
      this.users.set(userId, userData);
    } else {
      userData.ws = ws;
    }
    userData.rooms.add(roomId);

    // Track room membership
    let roomUsers = this.rooms.get(roomId);
    if (!roomUsers) {
      roomUsers = new Set();
      this.rooms.set(roomId, roomUsers);
    }
    roomUsers.add(userId);

    // Subscribe to redis channel if first user in room
    const count = (this.roomSubCount.get(roomId) || 0) + 1;
    this.roomSubCount.set(roomId, count);

    if (count === 1) {
      await this.subscriber.subscribe(`room:${roomId}`, (message) => {
        try {
          const parsed = JSON.parse(message);
          const usersInRoom = this.rooms.get(roomId);
          if (!usersInRoom) return;

          for (const uid of usersInRoom) {
            const user = this.users.get(uid);
            if (user && user.ws.readyState === WebSocket.OPEN) {
              user.ws.send(message);
            }
          }
        } catch (err) {
          console.error('[Redis] Error parsing message:', err);
        }
      });
    }
  }

  async unsubscribe(userId: string, roomId: string): Promise<void> {
    const userData = this.users.get(userId);
    if (userData) {
      userData.rooms.delete(roomId);
      if (userData.rooms.size === 0) {
        this.users.delete(userId);
      }
    }

    const roomUsers = this.rooms.get(roomId);
    if (roomUsers) {
      roomUsers.delete(userId);
      if (roomUsers.size === 0) {
        this.rooms.delete(roomId);
      }
    }

    const count = (this.roomSubCount.get(roomId) || 1) - 1;
    if (count <= 0) {
      this.roomSubCount.delete(roomId);
      try {
        await this.subscriber.unsubscribe(`room:${roomId}`);
      } catch {}
    } else {
      this.roomSubCount.set(roomId, count);
    }
  }

  async removeUser(userId: string): Promise<string[]> {
    const userData = this.users.get(userId);
    if (!userData) return [];

    const rooms = Array.from(userData.rooms);
    for (const roomId of rooms) {
      await this.unsubscribe(userId, roomId);
    }
    return rooms;
  }

  async publish(roomId: string, message: object): Promise<void> {
    await this.ensureConnected();
    await this.publisher.publish(`room:${roomId}`, JSON.stringify(message));
  }

  getUsersInRoom(roomId: string): string[] {
    const roomUsers = this.rooms.get(roomId);
    return roomUsers ? Array.from(roomUsers) : [];
  }

  getUserRooms(userId: string): string[] {
    const userData = this.users.get(userId);
    return userData ? Array.from(userData.rooms) : [];
  }

  broadcastToRoom(roomId: string, data: object, excludeUserId?: string): void {
    const roomUsers = this.rooms.get(roomId);
    if (!roomUsers) return;

    const message = JSON.stringify(data);
    for (const uid of roomUsers) {
      if (excludeUserId && uid === excludeUserId) continue;
      const user = this.users.get(uid);
      if (user && user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(message);
      }
    }
  }
}

export default RedisSubscriptionManager;
