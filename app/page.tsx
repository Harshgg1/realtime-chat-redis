'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Room } from '../types';
import { toast } from 'sonner';
import { 
  Orbit, 
  LogOut, 
  Plus, 
  Hash, 
  Users, 
  Copy, 
  Check,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchRooms();
    }
  }, [token]);

  async function fetchRooms() {
    try {
      const res = await fetch('/api/rooms', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const rawRooms = Array.isArray(data) ? data : data.rooms || [];
        setRooms(rawRooms.map((r: any) => ({
          id: r.id,
          name: r.name,
          memberCount: r._count?.members || r.memberCount || 0,
        })));
      }
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || data.message || 'Authentication failed');
        setIsSubmitting(false);
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setUsername('');
      setPassword('');
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully');
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setRooms([]);
    toast.info('Logged out securely');
  }

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newRoomName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || data.message || 'Failed to create room');
        return;
      }
      setNewRoomName('');
      fetchRooms();
      toast.success('Room created successfully');
    } catch (err) {
      toast.error('Network error while creating room');
    }
  }

  async function handleJoinRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!joinRoomId.trim()) return;
    try {
      const res = await fetch(`/api/rooms/${joinRoomId.trim()}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || data.message || 'Failed to join room');
        return;
      }
      setJoinRoomId('');
      fetchRooms();
      toast.success('Joined room successfully');
    } catch (err) {
      toast.error('Network error while joining room');
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex bg-zinc-950 font-sans selection:bg-teal-500/30">
        {/* Left Side: Auth Panel */}
        <div className="w-full lg:w-[480px] flex flex-col p-8 sm:p-12 xl:p-16 border-r border-zinc-900 bg-zinc-950 z-10">
          <div className="flex items-center mb-16">
            <Orbit className="w-8 h-8 text-teal-500 mr-3" />
            <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">SyncSphere</h1>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-zinc-50 tracking-tight mb-2">
              {isLogin ? 'Sign in to your account' : 'Create an account'}
            </h2>
            <p className="text-zinc-400 mb-8">
              {isLogin ? 'Enter your credentials to access your workspaces.' : 'Get started with real-time enterprise messaging.'}
            </p>
            
            <form onSubmit={handleAuth} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-50 placeholder-zinc-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none"
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-50 placeholder-zinc-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting || !username || !password}
                className="w-full py-3 bg-zinc-50 hover:bg-zinc-200 text-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors mt-4 flex justify-center items-center"
              >
                {isSubmitting ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
              </button>
            </form>
            
            <div className="mt-8 text-center">
              <button 
                type="button" 
                onClick={() => { setIsLogin(!isLogin); setUsername(''); setPassword(''); }}
                className="text-sm font-medium text-zinc-400 hover:text-zinc-50 transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Hero Visual */}
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden bg-zinc-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.15)_0,rgba(9,9,11,1)_50%)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          
          <div className="relative z-10 max-w-lg text-center px-8">
            <div className="w-20 h-20 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(20,184,166,0.2)]">
              <MessageSquare className="w-10 h-10 text-teal-500" />
            </div>
            <h2 className="text-4xl font-bold text-zinc-50 tracking-tight mb-4">
              Real-time communication, scaled instantly.
            </h2>
            <p className="text-zinc-400 text-lg">
              Experience the power of WebSockets and Redis Pub/Sub working in perfect harmony.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 font-sans selection:bg-teal-500/30">
      {/* Header */}
      <header className="bg-zinc-950 border-b border-zinc-900 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Orbit className="w-7 h-7 text-teal-500 mr-3" />
              <h1 className="text-lg font-bold text-zinc-50 tracking-tight">SyncSphere</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center text-sm font-medium text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                {user?.username}
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center text-sm font-medium text-zinc-400 hover:text-zinc-50 transition-colors bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-4 py-2 rounded-lg"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Rooms List */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden h-[calc(100vh-8rem)] flex flex-col">
              <div className="px-6 py-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                <h2 className="text-lg font-bold text-zinc-50">Your Rooms</h2>
                <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {rooms.length} Total
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {rooms.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                    <MessageSquare className="h-12 w-12 mb-4 text-zinc-700" />
                    <p className="text-base font-medium text-zinc-400">No active rooms</p>
                    <p className="text-sm mt-1 text-zinc-500">Create or join one to start messaging.</p>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <div 
                      key={room.id}
                      onClick={() => router.push(`/room/${room.id}`)}
                      className="group flex items-center p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-teal-500/50 hover:bg-zinc-900 transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-teal-500 font-bold text-lg flex-shrink-0 group-hover:bg-teal-500/10 group-hover:border-teal-500/30 transition-colors">
                        <Hash className="w-5 h-5" />
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <h3 className="text-base font-bold text-zinc-50 truncate group-hover:text-teal-400 transition-colors">
                          {room.name}
                        </h3>
                        <div className="flex items-center mt-1 space-x-3 text-xs text-zinc-400">
                          <span className="flex items-center">
                            <Users className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                            {room.memberCount || 1} members
                          </span>
                          <div 
                            className="flex items-center truncate bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded-md border border-zinc-700 transition-colors cursor-pointer ml-2 group/copy"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(room.id);
                              setCopiedId(room.id);
                              toast.success('Room ID copied to clipboard');
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            title="Copy Room ID"
                          >
                            <span className="truncate font-mono mr-2 text-zinc-300">{room.id}</span>
                            {copiedId === room.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-zinc-500 group-hover/copy:text-teal-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Actions */}
          <div className="space-y-6">
            
            {/* Create Room Card */}
            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/50">
                <h3 className="font-bold text-zinc-50 flex items-center">
                  <Plus className="w-4 h-4 mr-2 text-teal-500" />
                  Create Workspace
                </h3>
              </div>
              <div className="p-5">
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. Engineering Team"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-50 placeholder-zinc-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none text-sm"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={!newRoomName.trim()}
                    className="w-full py-2.5 bg-zinc-50 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-zinc-950 rounded-xl font-medium transition-colors text-sm"
                  >
                    Create Room
                  </button>
                </form>
              </div>
            </div>

            {/* Join Room Card */}
            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/50">
                <h3 className="font-bold text-zinc-50 flex items-center">
                  <Hash className="w-4 h-4 mr-2 text-teal-500" />
                  Join Workspace
                </h3>
              </div>
              <div className="p-5">
                <form onSubmit={handleJoinRoom} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Paste Room ID here"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-50 placeholder-zinc-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none text-sm font-mono"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={!joinRoomId.trim()}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:border-transparent text-zinc-300 disabled:text-zinc-600 disabled:bg-zinc-900/50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors text-sm"
                  >
                    Join Room
                  </button>
                </form>
              </div>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}