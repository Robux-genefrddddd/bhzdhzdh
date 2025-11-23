import { useState } from "react";
import { Plus, LogOut, Trash2, Clock, User } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
}

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: SidebarProps) {
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="hidden lg:flex w-[280px] h-screen flex-col bg-black border-r border-gray-900 shadow-2xl">
      {/* Header Section - User Profile */}
      <div className="px-6 py-6 border-b border-gray-900">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center shadow-inner border border-gray-700">
            <span className="text-white font-bold text-lg">U</span>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              Utilisateur
            </p>
            <p className="text-xs text-gray-500">Account</p>
          </div>
        </div>

        {/* New Conversation Button */}
        <button
          onClick={onNewConversation}
          className="btn-glow w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 text-sm"
        >
          <Plus size={18} />
          Nouvelle Conversation
        </button>
      </div>

      {/* Middle Section - Conversations List */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-3">
          Conversations
        </h3>
        <div className="space-y-2">
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                  activeConversationId === conv.id
                    ? "bg-blue-600/20 border border-blue-500/50 shadow-lg shadow-blue-500/20"
                    : "hover:backdrop-blur-md hover:bg-white/10 dark:hover:bg-white/8"
                }`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <Clock
                  size={16}
                  className={`flex-shrink-0 mt-1 ${
                    activeConversationId === conv.id
                      ? "text-blue-400"
                      : "text-gray-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate font-medium">
                    {conv.title}
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatTimestamp(conv.timestamp)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-500/20 rounded-md"
                  title="Delete conversation"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-600 px-2">No conversations yet</p>
          )}
        </div>
      </div>

      {/* Bottom Section - Plan Card */}
      <div className="px-4 py-4 border-t border-gray-900">
        <div
          className="relative rounded-lg overflow-hidden p-3 border border-gray-800"
          style={{
            backgroundColor: "#111111",
            boxShadow: "0 0 12px rgba(255, 255, 255, 0.03)",
          }}
        >
          {/* Content - Centered */}
          <div className="text-center">
            <span className="text-xs font-semibold text-gray-300">
              Plan: Gratuit
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button className="w-full mt-3 flex items-center gap-3 px-4 py-2.5 text-left text-red-500 hover:bg-red-500/10 rounded-lg transition-colors duration-200 text-sm">
          <LogOut size={18} />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
}
