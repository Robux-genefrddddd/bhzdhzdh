import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile } from "lucide-react";

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function InputArea({
  value,
  onChange,
  onSend,
  disabled = false,
  isLoading = false,
}: InputAreaProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 lg:left-[280px] border-t px-4 py-6 sm:px-6 md:px-8"
      style={{
        backgroundColor: "#000000",
        borderColor: "#1A1A1A",
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div
          className={`transition-all duration-300 ${
            isFocused ? "shadow-lg" : "shadow-md"
          }`}
          style={{
            backgroundColor: "#0D0D0D",
            border: "1px solid #2A2A2A",
            borderRadius: "24px",
            boxShadow: isFocused
              ? "0 0 20px #0A84FF40, 0 4px 20px rgba(0, 0, 0, 0.5)"
              : "0 4px 20px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div className="flex items-center gap-4 px-6 py-5">
            {/* Left Icons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-400 hover:text-gray-300"
                title="Attach file"
                type="button"
              >
                <Paperclip size={20} />
              </button>

              <button
                className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-400 hover:text-gray-300"
                title="Add emoji"
                type="button"
              >
                <Smile size={20} />
              </button>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Type your message..."
              className="flex-1 bg-transparent text-white focus:outline-none resize-none text-center"
              style={{
                color: "#EDEDED",
                lineHeight: "1.5",
              }}
              rows={1}
            />

            {/* Send Button */}
            <button
              onClick={onSend}
              disabled={!value.trim() || disabled || isLoading}
              className="flex-shrink-0 p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor:
                  !value.trim() || disabled || isLoading
                    ? "rgba(10, 132, 255, 0.3)"
                    : "rgba(10, 132, 255, 0.8)",
                boxShadow:
                  !value.trim() || disabled || isLoading
                    ? "none"
                    : "0 0 15px rgba(10, 132, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
              }}
              onMouseEnter={(e) => {
                if (!(!value.trim() || disabled || isLoading)) {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 0 25px rgba(10, 132, 255, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)";
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "rgba(10, 132, 255, 0.95)";
                }
              }}
              onMouseLeave={(e) => {
                if (!(!value.trim() || disabled || isLoading)) {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 0 15px rgba(10, 132, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "rgba(10, 132, 255, 0.8)";
                }
              }}
              title="Send message"
            >
              <Send size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Helper Text */}
        <p
          className="text-xs mt-3 px-4"
          style={{ color: "#666666" }}
        >
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
