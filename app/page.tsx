'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Room } from '../types';

export default function HomePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [roomError, setRoomError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    setAuthError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || data.message || 'Auth failed');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setUsername('');
      setPassword('');
    } catch (err) {
      setAuthError('Network error');
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setRooms([]);
  }

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    setRoomError('');
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
        setRoomError(data.error || data.message || 'Failed to create room');
        return;
      }
      setNewRoomName('');
      fetchRooms();
    } catch (err) {
      setRoomError('Network error');
    }
  }

  async function handleJoinRoom(e: React.FormEvent) {
    e.preventDefault();
    setRoomError('');
    if (!joinRoomId.trim()) return;
    try {
      const res = await fetch(`/api/rooms/${joinRoomId.trim()}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setRoomError(data.error || data.message || 'Failed to join room');
        return;
      }
      setJoinRoomId('');
      fetchRooms();
    } catch (err) {
      setRoomError('Network error');
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                {isLogin ? 'Sign in to access your chats' : 'Join to start chatting in real-time'}
              </p>
            </div>
            
            <form onSubmit={handleAuth} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              {authError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {authError}
                </div>
              )}
              
              <button 
                type="submit" 
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors shadow-md shadow-gray-900/10 active:scale-[0.98]"
              >
                {isLogin ? 'Sign In' : 'Sign Up'}
              </button>
            </form>
          </div>
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button 
                type="button" 
                onClick={() => { setIsLogin(!isLogin); setAuthError(''); }}
                className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                {isLogin ? 'Create one now' : 'Sign in instead'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center mr-3 shadow-sm flex-shrink-0">
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                  <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(45 12 12)" />
                  <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-45 12 12)" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">SyncSphere</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                {user?.username}
              </div>
              <button 
                onClick={handleLogout}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors bg-white hover:bg-gray-100 border border-gray-200 px-4 py-2 rounded-lg cursor-pointer"
              >
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-8rem)] flex flex-col">
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900">Your Rooms</h2>
                <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {rooms.length} Total
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                {rooms.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                    <p className="text-base font-medium text-gray-500">No rooms yet</p>
                    <p className="text-sm mt-1 text-gray-400">Create or join one to get started.</p>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <div 
                      key={room.id}
                      onClick={() => router.push(`/room/${room.id}`)}
                      className="group flex items-center p-4 rounded-xl border border-gray-100 bg-white hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer shadow-sm hover:shadow-md"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-primary-500/30 flex-shrink-0">
                        {room.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                          {room.name}
                        </h3>
                        <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500">
                          <span className="flex items-center">
                            <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            {room.memberCount || 1} members
                          </span>
                          <div 
                            className="flex items-center truncate bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded-md border border-gray-200 transition-colors cursor-pointer group/copy ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(room.id);
                              setCopiedId(room.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            title="Copy Room ID"
                          >
                            <span className="truncate font-mono mr-2 text-gray-600">{room.id}</span>
                            {copiedId === room.id ? (
                              <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5 text-gray-400 group-hover/copy:text-primary-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button className="bg-white text-primary-600 border border-primary-200 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors cursor-pointer">
                          Enter
                        </button>
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create a Room
                </h3>
              </div>
              <div className="p-5">
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. Project Apollo"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all outline-none bg-gray-50 focus:bg-white text-sm"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={!newRoomName.trim()}
                    className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors text-sm shadow-sm active:scale-[0.98] cursor-pointer"
                  >
                    Create New Room
                  </button>
                </form>
              </div>
            </div>

            {/* Join Room Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Join via ID
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
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all outline-none bg-gray-50 focus:bg-white text-sm font-mono"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={!joinRoomId.trim()}
                    className="w-full py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 disabled:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors text-sm shadow-sm active:scale-[0.98] cursor-pointer"
                  >
                    Join Room
                  </button>
                </form>
              </div>
            </div>
            
            {roomError && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-start border border-red-100 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {roomError}
              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
}