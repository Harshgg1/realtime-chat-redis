import React from 'react';

interface TypingIndicatorProps {
  typingUsers: Map<string, string>;
}

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  return (
    <div className="px-4 py-1 bg-transparent absolute bottom-[72px] left-0 text-xs font-medium text-teal-500 italic h-6 flex items-center z-10 pointer-events-none">
      {typingUsers.size > 0 && (
        <span className="flex items-center bg-zinc-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-zinc-800 shadow-sm">
          <span className="flex space-x-1 mr-2">
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </span>
          {Array.from(typingUsers.values()).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing
        </span>
      )}
    </div>
  );
}
