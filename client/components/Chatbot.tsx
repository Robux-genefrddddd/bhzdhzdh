import { useState, useRef, useEffect } from "react";
import { Send, Plus, User } from "lucide-react";
import Menu from "./Menu";
import Sidebar from "./Sidebar";
import InputArea from "./InputArea";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
}

export default function Chatbot() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "How to learn React",
      timestamp: new Date(Date.now() - 3600000),
      messages: [
        {
          id: "1",
          content: "Hello! I'm your AI assistant. How can I help you today?",
          sender: "assistant",
          timestamp: new Date(),
        },
      ],
    },
    {
      id: "2",
      title: "JavaScript best practices",
      timestamp: new Date(Date.now() - 86400000),
      messages: [
        {
          id: "1",
          content: "Let's discuss JavaScript best practices.",
          sender: "assistant",
          timestamp: new Date(),
        },
      ],
    },
    {
      id: "3",
      title: "Web development tips",
      timestamp: new Date(Date.now() - 172800000),
      messages: [
        {
          id: "1",
          content: "Here are some useful web development tips.",
          sender: "assistant",
          timestamp: new Date(),
        },
      ],
    },
  ]);

  const [activeConversationId, setActiveConversationId] = useState<string>("1");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(
    (conv) => conv.id === activeConversationId,
  );
  const messages = activeConversation?.messages || [];

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const initialDark = savedTheme ? savedTheme === "dark" : prefersDark;
    setIsDark(initialDark);
    updateTheme(initialDark);
  }, []);

  const updateTheme = (dark: boolean) => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const handleThemeToggle = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    updateTheme(newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !activeConversation) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversationId
          ? { ...conv, messages: [...conv.messages, userMessage] }
          : conv,
      ),
    );
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I'm a demonstration chatbot. This is where the AI response would appear. In a production app, this would be connected to a real API.",
        sender: "assistant",
        timestamp: new Date(),
      };
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? { ...conv, messages: [...conv.messages, assistantMessage] }
            : conv,
        ),
      );
      setIsLoading(false);
    }, 800);
  };

  const handleNewConversation = () => {
    const newId = Date.now().toString();
    const newConversation: Conversation = {
      id: newId,
      title: "New Conversation",
      timestamp: new Date(),
      messages: [
        {
          id: "1",
          content: "Hello! I'm your AI assistant. How can I help you today?",
          sender: "assistant",
          timestamp: new Date(),
        },
      ],
    };
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newId);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id));
    if (activeConversationId === id && conversations.length > 1) {
      const remaining = conversations.filter((conv) => conv.id !== id);
      setActiveConversationId(remaining[0].id);
    }
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#0a0a0a]">
      {/* Fixed Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-900 px-4 py-3 sm:px-6 md:px-8 bg-white dark:bg-black flex items-center justify-between gap-4">
          {/* Left: Title */}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-black dark:text-white truncate">
              Chat
            </h1>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Quick Action Button */}
            <button className="btn-icon-glass" title="New chat">
              <Plus size={20} className="text-black dark:text-white" />
            </button>

            {/* User Profile Button */}
            <button className="btn-icon-glass" title="User profile">
              <User size={20} className="text-black dark:text-white" />
            </button>

            {/* Hamburger Menu - Only on mobile */}
            <Menu isDark={isDark} onThemeToggle={handleThemeToggle} />
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 bg-white dark:bg-black pb-32">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                } animate-fade-in`}
              >
                <div
                  className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl px-5 py-3 rounded-2xl break-words ${
                    message.sender === "user"
                      ? "bg-black dark:bg-white text-white dark:text-black rounded-br-sm"
                      : "bg-gray-100 dark:bg-gray-900 text-black dark:text-white rounded-bl-sm border border-gray-200 dark:border-gray-800"
                  }`}
                >
                  <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p
                    className={`text-xs mt-2.5 ${
                      message.sender === "user"
                        ? "text-gray-400 dark:text-gray-600"
                        : "text-gray-500 dark:text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-gray-100 dark:bg-gray-900 text-black dark:text-white px-5 py-3 rounded-2xl rounded-bl-sm border border-gray-200 dark:border-gray-800">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area Component */}
        <InputArea
          value={input}
          onChange={setInput}
          onSend={handleSendMessage}
          disabled={isLoading}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
