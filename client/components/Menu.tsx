import { useState, useEffect } from "react";
import {
  Settings,
  User,
  Moon,
  Sun,
  HelpCircle,
  LogOut,
  Menu as MenuIcon,
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

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 flex flex-col justify-center items-center gap-1.5 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors duration-200 p-1"
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
        className={`fixed top-0 left-0 h-screen w-64 sm:w-72 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-900 shadow-2xl z-50 transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          boxShadow: isOpen ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)" : "none",
        }}
      >
        {/* Menu Header */}
        <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-900">
          <h2 className="text-lg font-bold text-black dark:text-white">Menu</h2>
        </div>

        {/* Menu Items */}
        <nav className="px-4 py-6 space-y-2">
          {/* Paramètres */}
          <button
            onClick={handleMenuItemClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200"
          >
            <Settings size={20} />
            <span className="font-medium">Paramètres</span>
          </button>

          {/* Profil */}
          <button
            onClick={handleMenuItemClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200"
          >
            <User size={20} />
            <span className="font-medium">Profil</span>
          </button>

          {/* Divider */}
          <div className="my-4 border-t border-gray-200 dark:border-gray-800" />

          {/* Thème */}
          <button
            onClick={() => {
              onThemeToggle();
              handleMenuItemClick();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
            <span className="font-medium flex-1">
              Thème : {isDark ? "Sombre" : "Clair"}
            </span>
            <div className="w-10 h-6 rounded-full border-2 border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 flex items-center p-0.5">
              <div
                className={`w-5 h-5 rounded-full bg-black dark:bg-white transition-transform duration-300 ${
                  isDark ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
          </button>

          {/* Aide */}
          <button
            onClick={handleMenuItemClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200"
          >
            <HelpCircle size={20} />
            <span className="font-medium">Aide</span>
          </button>

          {/* Divider */}
          <div className="my-4 border-t border-gray-200 dark:border-gray-800" />

          {/* Déconnexion */}
          <button
            onClick={handleMenuItemClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Déconnexion</span>
          </button>
        </nav>
      </div>
    </>
  );
}
