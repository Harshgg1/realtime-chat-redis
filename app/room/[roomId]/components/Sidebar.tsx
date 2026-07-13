import React from 'react';
import { Member } from '../../../../types';
import { Users, X } from 'lucide-react';

interface SidebarProps {
  members: Member[];
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ members, isOpen, onClose }: SidebarProps) {
  return (
    <>
      <div className={`fixed inset-y-0 left-0 z-20 w-64 bg-zinc-950 border-r border-zinc-900 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-900/30 flex justify-between items-center h-16">
            <h2 className="font-bold text-zinc-50 flex items-center">
              <Users className="w-5 h-5 mr-2 text-teal-500" />
              Members <span className="ml-2 text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 py-0.5 px-2 rounded-full">{members.length}</span>
            </h2>
            <button className="md:hidden text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {members.map((member) => (
              <div key={member.id} className="group flex items-center p-2 rounded-xl hover:bg-zinc-900/80 transition-colors">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-teal-500 font-bold text-sm shadow-sm group-hover:bg-teal-500/10 group-hover:border-teal-500/30 transition-colors">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-zinc-950 ${member.online ? 'bg-emerald-500' : 'bg-zinc-600'}`}></div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-50 truncate group-hover:text-teal-400 transition-colors">{member.username}</p>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">
                    {member.online ? 'Online' : member.lastSeen ? `Last seen ${new Date(member.lastSeen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Offline'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-10 md:hidden backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        ></div>
      )}
    </>
  );
}
