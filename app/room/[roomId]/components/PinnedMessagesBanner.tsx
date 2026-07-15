import React from 'react';
import { Message } from '../../../../types';
import { Pin, X, PinOff } from 'lucide-react';

interface PinnedMessagesBannerProps {
  pinnedMessages: Message[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isAdmin: boolean;
  onUnpin: (msgId: string) => void;
}

export default function PinnedMessagesBanner({
  pinnedMessages,
  isOpen,
  setIsOpen,
  isAdmin,
  onUnpin,
}: PinnedMessagesBannerProps) {
  if (pinnedMessages.length === 0) return null;

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 relative z-10 shadow-sm">
      <div 
        className="flex items-center justify-between px-4 sm:px-6 py-2 cursor-pointer hover:bg-zinc-800/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2 text-zinc-300">
          <Pin className="w-4 h-4 text-teal-500" />
          <span className="text-sm font-medium">Pinned Messages ({pinnedMessages.length})</span>
        </div>
        <div className="text-xs font-medium text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800">
          {isOpen ? 'Close' : 'View All'}
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-zinc-900 border-b border-zinc-800 shadow-xl max-h-64 overflow-y-auto">
          <div className="flex flex-col">
            {pinnedMessages.map((msg) => (
              <div key={msg.id} className="p-4 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-teal-400">{msg.senderUsername}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-zinc-500">
                      {new Date(msg.pinnedAt || msg.createdAt).toLocaleDateString()} {new Date(msg.pinnedAt || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isAdmin && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onUnpin(msg.id); }} 
                        className="text-zinc-500 hover:text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Unpin"
                      >
                        <PinOff className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed line-clamp-3">
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
