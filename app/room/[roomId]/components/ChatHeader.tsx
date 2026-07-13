import React from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Check, Copy, Search, X, ArrowLeft, LogOut } from 'lucide-react';

interface ChatHeaderProps {
  roomName: string;
  roomId: string;
  wsStatus: 'connecting' | 'connected' | 'disconnected';
  onToggleSidebar: () => void;
  onLeave: () => void;
  // Search
  searchInput: string;
  isSearching: boolean;
  onSearchInputChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onClearSearch: () => void;
}

export default function ChatHeader({
  roomName,
  roomId,
  wsStatus,
  onToggleSidebar,
  onLeave,
  searchInput,
  isSearching,
  onSearchInputChange,
  onSearch,
  onClearSearch,
}: ChatHeaderProps) {
  const router = useRouter();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedId(roomId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between h-16 shadow-sm z-10 sticky top-0">
        <div className="flex items-center min-w-0">
          <button className="md:hidden mr-3 text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors" onClick={onToggleSidebar}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex flex-col min-w-0 mr-4">
            <div className="flex items-center">
              <h1 className="text-lg font-bold text-zinc-50 truncate">
                {roomName || roomId}
              </h1>
              <span className={`ml-2 flex-shrink-0 w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : wsStatus === 'connecting' ? 'bg-amber-500' : 'bg-red-500'}`} title={`WebSocket: ${wsStatus}`}></span>
            </div>
            <div className="flex items-center mt-0.5 text-xs text-zinc-500">
              <span className="mr-1.5 opacity-70">ID:</span>
              <div 
                className="flex items-center bg-zinc-900 hover:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-800 transition-colors cursor-pointer group/copy"
                onClick={handleCopy}
                title="Copy Room ID"
              >
                <span className="font-mono text-[11px] text-zinc-400 mr-1.5 truncate max-w-[100px] sm:max-w-none">{roomId}</span>
                {copiedId === roomId ? (
                  <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Copy className="w-3 h-3 text-zinc-600 group-hover/copy:text-teal-400 transition-colors flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Desktop Search */}
          <form onSubmit={onSearch} className="hidden sm:flex items-center relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              className="w-48 pl-9 pr-8 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-zinc-50 placeholder-zinc-500 outline-none transition-all"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            {isSearching && (
              <button type="button" onClick={onClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
          <button onClick={() => router.push('/')} className="text-zinc-400 hover:text-zinc-50 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer hidden sm:block" title="Back to Dashboard">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button onClick={onLeave} className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center border border-red-500/20">
            <span className="hidden sm:inline">Leave</span>
            <LogOut className="w-4 h-4 sm:ml-1.5" />
          </button>
        </div>
      </div>

      {/* Mobile Search — Below header, visible only on small screens */}
      <div className="sm:hidden px-4 py-2 border-b border-zinc-900 bg-zinc-950">
        <form onSubmit={onSearch} className="flex items-center relative w-full">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-zinc-50 placeholder-zinc-500 outline-none transition-all"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          {isSearching && (
            <button type="button" onClick={onClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>
    </>
  );
}
