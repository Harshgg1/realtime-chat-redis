import React from 'react';
import { Message } from '../../../../types';
import { Check, CheckCheck, Trash2, Edit2, Pin, PinOff } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isAdmin: boolean;
  showHeader: boolean;
  onEdit: (msg: Message) => void;
  onDelete: (msgId: string) => void;
  onPin: (msgId: string) => void;
  onUnpin: (msgId: string) => void;
  receiptStatus: string;
}

export default function MessageBubble({ message: msg, isOwn, isAdmin, showHeader, onEdit, onDelete, onPin, onUnpin, receiptStatus }: MessageBubbleProps) {
  const canEdit = isOwn && !msg.isDeleted;
  const canDelete = (isOwn || isAdmin) && !msg.isDeleted;
  const canPin = isAdmin && !msg.isDeleted;
  const showActions = canEdit || canDelete || canPin;

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} mb-1`}>
      {showHeader && (
        <span className="text-[11px] font-semibold text-zinc-500 mb-1 ml-1 mr-1 uppercase tracking-wider flex items-center gap-1.5">
          {msg.isPinned && <Pin className="w-3 h-3 text-teal-500 fill-teal-500/20" />}
          {isOwn ? 'You' : msg.senderUsername}
        </span>
      )}
      {!showHeader && msg.isPinned && (
         <span className="text-[10px] font-medium text-teal-500 mb-0.5 flex items-center gap-1 ml-1 mr-1">
           <Pin className="w-2.5 h-2.5 fill-teal-500/20" /> Pinned
         </span>
      )}
      
      <div className="group relative max-w-[85%] sm:max-w-[75%]">
        <div
          className={`px-4 py-2.5 rounded-2xl shadow-sm transition-all ${
            msg.isDeleted
              ? 'bg-zinc-900 border border-zinc-800 text-zinc-500 italic rounded-bl-sm'
              : isOwn
                ? msg.isPinned ? 'bg-teal-600 text-zinc-50 rounded-br-sm border border-teal-400' : 'bg-teal-600 text-zinc-50 rounded-br-sm'
                : msg.isPinned ? 'bg-zinc-800 border border-teal-500/50 text-zinc-50 rounded-bl-sm' : 'bg-zinc-800 border border-zinc-700 text-zinc-50 rounded-bl-sm'
          }`}
        >
          {msg.isDeleted ? (
            'This message was deleted'
          ) : (
            <div className="break-words leading-relaxed text-[15px] whitespace-pre-wrap">{msg.content}</div>
          )}
        </div>

        {/* Message Meta (Time, Edit, Delete, Status) */}
        <div className={`flex items-center mt-1.5 space-x-2 text-[11px] font-medium text-zinc-500 ${isOwn ? 'justify-end mr-1' : 'ml-1'}`}>
          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

          {msg.isEdited && !msg.isDeleted && <span className="italic text-zinc-600">(edited)</span>}

          {showActions && (
            <div className={`hidden group-hover:flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800 absolute top-0 ${isOwn ? '-left-12 -translate-x-full' : '-right-12 translate-x-full'} -translate-y-1/2 z-10`}>
              {canPin && (
                <button onClick={() => msg.isPinned ? onUnpin(msg.id) : onPin(msg.id)} className="hover:text-teal-400 transition-colors cursor-pointer flex items-center" title={msg.isPinned ? "Unpin" : "Pin"}>
                  {msg.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </button>
              )}
              {canPin && (canEdit || canDelete) && <div className="w-px h-3 bg-zinc-800"></div>}
              {canEdit && (
                <button onClick={() => onEdit(msg)} className="hover:text-teal-400 transition-colors cursor-pointer flex items-center" title="Edit">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {canEdit && canDelete && <div className="w-px h-3 bg-zinc-800"></div>}
              {canDelete && (
                <button onClick={() => onDelete(msg.id)} className="hover:text-red-400 transition-colors cursor-pointer flex items-center" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {isOwn && !msg.isDeleted && (
            <span className={`flex items-center ${receiptStatus === 'Seen' ? 'text-teal-500' : 'text-zinc-600'}`}>
              {receiptStatus === 'Sent' && <Check className="w-3.5 h-3.5" />}
              {receiptStatus === 'Delivered' && <CheckCheck className="w-3.5 h-3.5" />}
              {receiptStatus === 'Seen' && <CheckCheck className="w-3.5 h-3.5 text-teal-500" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
