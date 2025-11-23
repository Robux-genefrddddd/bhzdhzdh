import { useState } from "react";
import { X, Upload, Link as LinkIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AvatarModal({ isOpen, onClose }: AvatarModalProps) {
  const { user, updateAvatar } = useAuth();
  const [imageUrl, setImageUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [activeTab, setActiveTab] = useState<"url" | "upload">(
    user?.avatarType === "url" ? "url" : "upload",
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) return;
    setIsLoading(true);
    try {
      await updateAvatar(imageUrl, "url");
      setImageUrl("");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        await updateAvatar(dataUrl, "image");
        onClose();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error uploading file:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl p-8 w-full max-w-md shadow-2xl border overflow-hidden"
        style={{
          backgroundColor: "#0A0A0A",
          borderColor: "#1A1A1A",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>
            Customize Avatar
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} style={{ color: "#FFFFFF" }} />
          </button>
        </div>

        {/* Avatar Preview */}
        <div className="flex justify-center mb-8">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center border-2"
            style={{
              backgroundColor: "#1A1A1A",
              borderColor: "#0A84FF",
              boxShadow: "0 0 20px rgba(10, 132, 255, 0.3)",
            }}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt="preview"
                className="w-full h-full rounded-full object-cover"
              />
            )}
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-2 mb-6 border-b"
          style={{ borderColor: "#1A1A1A" }}
        >
          {(["url", "upload"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab === "url" && "URL"}
              {tab === "upload" && "Upload"}
            </button>
          ))}
        </div>

        {/* URL Tab */}
        {activeTab === "url" && (
          <div className="space-y-4 mb-6">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#FFFFFF" }}
              >
                Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-4 py-2 rounded-lg border focus:outline-none transition-all"
                style={{
                  backgroundColor: "#1A1A1A",
                  borderColor: imageUrl ? "#0A84FF" : "#2A2A2A",
                  color: "#FFFFFF",
                }}
              />
            </div>
            <button
              onClick={handleUrlSubmit}
              disabled={!imageUrl.trim() || isLoading}
              className="w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: imageUrl.trim() ? "#0A84FF" : "#2A2A2A",
                color: "#FFFFFF",
              }}
            >
              <LinkIcon size={18} />
              Use Avatar
            </button>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === "upload" && (
          <div className="space-y-4 mb-6">
            <label
              className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors hover:border-blue-500"
              style={{
                backgroundColor: "#1A1A1A",
                borderColor: fileName ? "#0A84FF" : "#2A2A2A",
              }}
            >
              <Upload size={24} style={{ color: "#0A84FF" }} />
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: "#FFFFFF" }}>
                  {fileName || "Click to upload"}
                </p>
                <p className="text-xs" style={{ color: "#666666" }}>
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
              <input
                type="file"
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </label>
            {isLoading && (
              <p className="text-sm text-center" style={{ color: "#0A84FF" }}>
                Uploading...
              </p>
            )}
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-lg font-semibold transition-colors border"
          style={{
            backgroundColor: "transparent",
            borderColor: "#2A2A2A",
            color: "#FFFFFF",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor =
              "rgba(255, 255, 255, 0.05)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor =
              "transparent";
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
