import React from 'react';
import { Send, Edit2, X, Check } from 'lucide-react';

interface ChatInputProps {
  inputValue: string;
  editingMessageId: string | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
}

export default function ChatInput({ inputValue, editingMessageId, onInputChange, onSend, onCancelEdit }: ChatInputProps) {
  return (
    <div className="bg-zinc-950 border-t border-zinc-900 p-3 sm:p-4 z-10">
      {editingMessageId && (
        <div className="flex items-center justify-between bg-zinc-900 px-4 py-2 rounded-t-xl border-x border-t border-zinc-800 text-sm">
          <span className="text-teal-500 font-medium flex items-center">
            <Edit2 className="w-4 h-4 mr-1.5" />
            Editing message
          </span>
          <button onClick={onCancelEdit} className="text-zinc-500 hover:text-zinc-300 cursor-pointer p-1 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <form onSubmit={onSend} className="max-w-3xl mx-auto flex items-end space-x-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={onInputChange}
            placeholder="Type your message..."
            className={`w-full px-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 text-zinc-50 placeholder-zinc-500 outline-none transition-all shadow-sm ${editingMessageId ? 'rounded-b-xl rounded-t-none border-t-0' : 'rounded-2xl'}`}
          />
        </div>
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="bg-teal-600 hover:bg-teal-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-50 rounded-2xl p-3 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer disabled:cursor-not-allowed h-[50px] w-[50px] flex-shrink-0"
        >
          {editingMessageId ? (
            <Check className="w-5 h-5" />
          ) : (
            <Send className="w-5 h-5 ml-0.5" />
          )}
        </button>
      </form>
    </div>
  );
}
