import React from 'react';
import { Message } from '../../../../types';
import MessageBubble from './MessageBubble';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  hasMore: boolean;
  loadingMore: boolean;
  isSearching: boolean;
  searchQuery: string;
  onLoadMore: () => void;
  onEdit: (msg: Message) => void;
  onDelete: (msgId: string) => void;
  getReceiptStatus: (msg: Message) => string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
}

export default function MessageList({
  messages,
  currentUserId,
  hasMore,
  loadingMore,
  isSearching,
  searchQuery,
  onLoadMore,
  onEdit,
  onDelete,
  getReceiptStatus,
  messagesEndRef,
  messagesContainerRef,
}: MessageListProps) {
  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950"
    >
      <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full">

        {hasMore && !isSearching && (
          <div className="text-center my-4">
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 px-4 py-1.5 rounded-full text-sm font-medium shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {loadingMore ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-zinc-500" />
                  Loading...
                </span>
              ) : 'Load Older Messages'}
            </button>
          </div>
        )}

        {isSearching && (
          <div className="bg-teal-500/10 text-teal-400 p-3 rounded-xl text-center text-sm font-medium border border-teal-500/20 mb-6 shadow-sm mx-auto max-w-sm">
            Search results for: <span className="font-bold text-teal-300">&quot;{searchQuery}&quot;</span>
          </div>
        )}

        <div className="space-y-5">
          {messages.map((msg, index) => {
            const isOwn = msg.senderId === currentUserId;
            const showHeader =
              index === 0 ||
              messages[index - 1].senderId !== msg.senderId ||
              new Date(msg.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 5 * 60 * 1000;

            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={isOwn}
                showHeader={showHeader}
                onEdit={onEdit}
                onDelete={onDelete}
                receiptStatus={isOwn ? getReceiptStatus(msg) : 'Sent'}
              />
            );
          })}
        </div>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
