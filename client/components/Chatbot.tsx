import { useState, useRef, useEffect } from "react";
import { Send, Plus, User, Zap, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Menu from "./Menu";
import Sidebar from "./Sidebar";
import InputArea from "./InputArea";
import CodeBlock from "./CodeBlock";
import LicenseDialog from "./LicenseDialog";
import { parseCodeBlocks } from "@/lib/codeDisplay";
import { useAuth } from "@/hooks/useAuth";
import { PrivateMessageHistory } from "@/lib/privateMessageHistory";

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
  const navigate = useNavigate();
  const { user, canSendMessage, incrementMessageCount } = useAuth();
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful assistant. Respond to user queries in a clear, concise, and friendly manner.",
  );
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const savedConversations = localStorage.getItem("conversations");
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        return parsed.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
      } catch {
        // If parsing fails, create a new conversation
      }
    }
    const newId = Date.now().toString();
    return [
      {
        id: newId,
        title: "New Conversation",
        timestamp: new Date(),
        messages: [],
      },
    ];
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(
    () => conversations[0]?.id || Date.now().toString(),
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [licenseDialogOpen, setLicenseDialogOpen] = useState(false);
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

  useEffect(() => {
    fetchAIConfig();
  }, []);

  const fetchAIConfig = async () => {
    try {
      const response = await fetch("/api/ai-config");
      if (response.ok) {
        const data = await response.json();
        setSystemPrompt(data.config.systemPrompt);
      }
    } catch (err) {
      console.error("Failed to load AI config:", err);
    }
  };

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

  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations));
  }, [conversations]);

  const handleSendMessage = async () => {
    if (!input.trim() || !activeConversation) return;

    if (!canSendMessage()) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `You have reached your message limit on your plan. Please upgrade to continue.`,
        sender: "assistant",
        timestamp: new Date(),
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? { ...conv, messages: [...conv.messages, errorMessage] }
            : conv,
        ),
      );
      return;
    }

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

    try {
      const historyMessages = activeConversation.messages
        .concat(userMessage)
        .map((msg) => ({
          role:
            msg.sender === "user" ? ("user" as const) : ("assistant" as const),
          content: msg.content,
        }));

      const messagesForAPI = [
        {
          role: "system" as const,
          content: systemPrompt,
        },
        ...historyMessages,
      ];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesForAPI,
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
          throw new Error(errorData.error || "Failed to get response from AI");
        } catch (parseError) {
          throw new Error(
            `Failed to get response from AI: ${response.statusText}`,
          );
        }
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Failed to parse AI response");
      }
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.content,
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

      if (user) {
        try {
          await PrivateMessageHistory.savePrivateMessage(
            user.id,
            user.email,
            input,
            data.content,
          );
        } catch (err) {
          console.error("Failed to save private message:", err);
        }
      }

      await incrementMessageCount();
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Error: ${
          error instanceof Error ? error.message : "Failed to get response"
        }`,
        sender: "assistant",
        timestamp: new Date(),
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? { ...conv, messages: [...conv.messages, errorMessage] }
            : conv,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    const newId = Date.now().toString();
    const newConversation: Conversation = {
      id: newId,
      title: "New Conversation",
      timestamp: new Date(),
      messages: [],
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

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === id ? { ...conv, title: newTitle } : conv,
      ),
    );
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: "#000000" }}>
      {/* Fixed Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div
          className="border-b px-4 py-3 sm:px-6 md:px-8 flex items-center justify-between gap-4"
          style={{
            backgroundColor: "#0A0A0A",
            borderColor: "#1A1A1A",
          }}
        >
          {/* Left: Title and Counter */}
          <div className="min-w-0 flex items-center gap-4">
            <div>
              <h1
                className="text-xl sm:text-2xl font-bold truncate"
                style={{ color: "#FFFFFF" }}
              >
                Chat
              </h1>
              {user?.plan === "Gratuit" && (
                <p className="text-xs" style={{ color: "#999999" }}>
                  Messages: {user?.messageCount || 0}/100
                </p>
              )}
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Upgrade Button - Only for Free Plan */}
            {user?.plan === "Gratuit" && (
              <button
                onClick={() => setLicenseDialogOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200"
                title="Upgrade plan"
                style={{
                  backgroundColor: "#FF9500",
                  color: "#FFFFFF",
                }}
              >
                <Zap size={18} />
                <span className="text-sm hidden sm:inline">Upgrade</span>
              </button>
            )}

            {/* New Chat Button */}
            <button
              onClick={handleNewConversation}
              className="p-2 rounded-lg transition-colors duration-200"
              title="New chat"
              style={{
                backgroundColor: "#1A1A1A",
                color: "#FFFFFF",
              }}
            >
              <Plus size={20} />
            </button>

            {/* Settings Button */}
            <button
              onClick={() => navigate("/settings")}
              className="p-2 rounded-lg transition-colors duration-200 hover:bg-white/10"
              title="Settings"
              style={{
                backgroundColor: "#1A1A1A",
                color: "#FFFFFF",
              }}
            >
              <SettingsIcon size={20} />
            </button>

            {/* User Profile Button */}
            <button
              className="p-2 rounded-lg transition-colors duration-200"
              title="User profile"
              style={{
                backgroundColor: "#1A1A1A",
                color: "#FFFFFF",
              }}
            >
              <User size={20} />
            </button>

            {/* Hamburger Menu - Only on mobile */}
            <Menu isDark={isDark} onThemeToggle={handleThemeToggle} />
          </div>
        </div>

        {/* Messages Container */}
        <div
          className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 pb-32"
          style={{ backgroundColor: "#000000" }}
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                } animate-fade-in`}
              >
                <div
                  className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl px-5 py-3 rounded-2xl break-words"
                  style={
                    message.sender === "user"
                      ? {
                          backgroundColor: "#0A84FF",
                          color: "#FFFFFF",
                          borderRadius: "20px 20px 4px 20px",
                        }
                      : {
                          backgroundColor: "#1A1A1A",
                          color: "#FFFFFF",
                          border: "1px solid #2A2A2A",
                          borderRadius: "20px 20px 20px 4px",
                        }
                  }
                >
                  {message.sender === "user" ? (
                    <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  ) : (
                    <div>
                      {parseCodeBlocks(message.content).map((part, idx) =>
                        typeof part === "string" ? (
                          <p
                            key={idx}
                            className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap mb-2"
                          >
                            {part}
                          </p>
                        ) : (
                          <CodeBlock
                            key={idx}
                            code={part.code}
                            language={part.language}
                          />
                        ),
                      )}
                    </div>
                  )}
                  <p
                    className="text-xs mt-2.5"
                    style={
                      message.sender === "user"
                        ? { color: "rgba(255, 255, 255, 0.6)" }
                        : { color: "#666666" }
                    }
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
                <div
                  className="px-5 py-3 rounded-2xl"
                  style={{
                    backgroundColor: "#1A1A1A",
                    border: "1px solid #2A2A2A",
                    borderRadius: "20px 20px 20px 4px",
                  }}
                >
                  <div className="flex space-x-2">
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: "#666666" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: "#666666",
                        animationDelay: "0.2s",
                      }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: "#666666",
                        animationDelay: "0.4s",
                      }}
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

      {/* License Dialog */}
      <LicenseDialog
        isOpen={licenseDialogOpen}
        onClose={() => setLicenseDialogOpen(false)}
      />
    </div>
  );
}
