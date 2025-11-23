import { useState, useEffect } from "react";
import {
  Settings,
  User,
  Moon,
  Sun,
  HelpCircle,
  LogOut,
  Plus,
  Trash2,
  Clock,
} from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
}

interface MenuProps {
  isDark: boolean;
  onThemeToggle: () => void;
}

export default function Menu({ isDark, onThemeToggle }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "How to learn React",
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: "2",
      title: "JavaScript best practices",
      timestamp: new Date(Date.now() - 86400000),
    },
    {
      id: "3",
      title: "Web development tips",
      timestamp: new Date(Date.now() - 172800000),
    },
  ]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleMenuItemClick = () => {
    setIsOpen(false);
  };

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "New Conversation",
      timestamp: new Date(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    handleMenuItemClick();
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id));
  };

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
    <>
      {/* Hamburger Button - Only show on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden btn-icon-glass w-10 h-10 flex flex-col justify-center items-center gap-1.5 focus:outline-none p-1"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <span
          className={`block w-5 h-0.5 bg-black dark:bg-white transition-all duration-300 origin-center ${
            isOpen ? "rotate-45 translate-y-2" : ""
          }`}
        />
        <span
          className={`block w-5 h-0.5 bg-black dark:bg-white transition-all duration-300 ${
            isOpen ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block w-5 h-0.5 bg-black dark:bg-white transition-all duration-300 origin-center ${
            isOpen ? "-rotate-45 -translate-y-2" : ""
          }`}
        />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-60 z-40 transition-opacity duration-300 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 sm:w-72 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-900 shadow-2xl z-50 transition-transform duration-300 ease-out overflow-hidden flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          boxShadow: isOpen ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)" : "none",
        }}
      >
        {/* Menu Header with New Conversation Button */}
        <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-900 flex-shrink-0">
          <h2 className="text-lg font-bold text-black dark:text-white mb-4">
            Menu
          </h2>
          <button
            onClick={handleNewConversation}
            className="btn-glow w-full flex items-center justify-center gap-2 px-4 py-2 text-sm"
          >
            <Plus size={18} />
            Nouvelle Conversation
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Conversations List */}
          <div className="px-4 py-6">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 mb-3">
              Conversations
            </h3>
            <div className="space-y-2">
              {conversations.length > 0 ? (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="group relative flex items-start gap-3 px-3 py-2 rounded-lg hover:backdrop-blur-md hover:bg-white/10 dark:hover:bg-white/8 transition-all duration-200 cursor-pointer"
                  >
                    <Clock
                      size={16}
                      className="text-gray-400 dark:text-gray-600 flex-shrink-0 mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-black dark:text-white truncate font-medium">
                        {conv.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {formatTimestamp(conv.timestamp)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md"
                      title="Delete conversation"
                    >
                      <Trash2
                        size={16}
                        className="text-red-600 dark:text-red-500"
                      />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-500 px-2">
                  No conversations yet
                </p>
              )}
            </div>
          </div>

          {/* Quick Settings Section */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-900">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 mb-3">
              Paramètres Rapides
            </h3>
            <nav className="space-y-2">
              {/* Paramètres */}
              <button
                onClick={handleMenuItemClick}
                className="w-full flex items-center gap-3 px-4 py-2 text-left text-black dark:text-white transition-all duration-200 text-sm hover:backdrop-blur-md hover:bg-white/10 dark:hover:bg-white/8 rounded-lg"
              >
                <Settings size={18} />
                <span className="font-medium">Paramètres</span>
              </button>

              {/* Profil */}
              <button
                onClick={handleMenuItemClick}
                className="w-full flex items-center gap-3 px-4 py-2 text-left text-black dark:text-white transition-all duration-200 text-sm hover:backdrop-blur-md hover:bg-white/10 dark:hover:bg-white/8 rounded-lg"
              >
                <User size={18} />
                <span className="font-medium">Profil</span>
              </button>

              {/* Aide */}
              <button
                onClick={handleMenuItemClick}
                className="w-full flex items-center gap-3 px-4 py-2 text-left text-black dark:text-white transition-all duration-200 text-sm hover:backdrop-blur-md hover:bg-white/10 dark:hover:bg-white/8 rounded-lg"
              >
                <HelpCircle size={18} />
                <span className="font-medium">Aide</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Footer - Thème et Déconnexion */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-900 space-y-2 flex-shrink-0">
          {/* Thème */}
          <button
            onClick={() => {
              onThemeToggle();
              handleMenuItemClick();
            }}
            className="w-full flex items-center justify-between px-4 py-2 text-black dark:text-white transition-all duration-200 hover:backdrop-blur-md hover:bg-white/10 dark:hover:bg-white/8 rounded-lg"
          >
            <div className="flex items-center gap-3">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
              <span className="font-medium text-sm">
                {isDark ? "Mode Clair" : "Mode Sombre"}
              </span>
            </div>
            <div className="w-9 h-5 rounded-full border-2 border-white/30 dark:border-white/20 bg-white/10 dark:bg-white/8 flex items-center p-0.5">
              <div
                className={`w-4 h-4 rounded-full bg-black dark:bg-white transition-transform duration-300 ${
                  isDark ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
          </button>

          {/* Déconnexion */}
          <button
            onClick={handleMenuItemClick}
            className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-600 dark:text-red-500 transition-all duration-200 hover:backdrop-blur-md hover:bg-red-500/10 dark:hover:bg-red-500/8 rounded-lg"
          >
            <LogOut size={18} />
            <span className="font-medium text-sm">Déconnexion</span>
          </button>
        </div>
      </div>
    </>
  );
}
