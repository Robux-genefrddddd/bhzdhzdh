import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Users,
  BarChart3,
  Settings,
  Key,
  AlertTriangle,
  Ban,
  Clock,
  Power,
  Copy,
  Check,
  Trash2,
  Zap,
} from "lucide-react";
import { GeneratedLicense, AIConfig, UserListItem } from "@shared/api";
import { adminFetchJSON } from "@/lib/adminAPI";

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalMessagesUsed: number;
}

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalMessagesUsed: 0,
  });

  const [activeTab, setActiveTab] = useState<
    "overview" | "licenses" | "users" | "ai-config" | "maintenance" | "message-history"
  >("overview");

  // License states
  const [licenseForm, setLicenseForm] = useState({
    plan: "Classic" as const,
    durationDays: 30,
  });
  const [generatedLicenses, setGeneratedLicenses] = useState<
    GeneratedLicense[]
  >([]);
  const [generatedKey, setGeneratedKey] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);

  // AI Config states
  const [aiConfig, setAIConfig] = useState<AIConfig>({
    model: "x-ai/grok-4.1-fast",
    systemPrompt:
      "You are a helpful assistant. Respond to user queries in a clear, concise, and friendly manner.",
    temperature: 0.7,
    maxTokens: 1024,
  });
  const [aiConfigEditing, setAIConfigEditing] = useState(false);
  const [aiConfigChanges, setAIConfigChanges] = useState<Partial<AIConfig>>({});

  // User management states
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [banReason, setBanReason] = useState("");

  // Maintenance states
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "La plateforme est actuellement en maintenance. Veuillez réessayer plus tard.",
  );

  // Message history states
  const [messageHistory, setMessageHistory] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    const adminAuth = sessionStorage.getItem("admin_authenticated");
    const token = sessionStorage.getItem("admin_token");
    if (adminAuth !== "true" || !token) {
      navigate("/admin-login");
      return;
    }

    fetchLicenses();
    fetchAIConfig();
    fetchUsers();
  }, [navigate]);

  const adminAuth = sessionStorage.getItem("admin_authenticated");
  const token = sessionStorage.getItem("admin_token");
  if (adminAuth !== "true" || !token) {
    return null;
  }

  const fetchLicenses = async () => {
    try {
      const data = await adminFetchJSON<any>("/api/admin/licenses");
      setGeneratedLicenses(data.licenses || []);
    } catch (err) {
      console.error("Failed to fetch licenses:", err);
    }
  };

  const fetchAIConfig = async () => {
    try {
      const data = await adminFetchJSON<any>("/api/admin/ai-config");
      setAIConfig(data.config);
    } catch (err) {
      console.error("Failed to fetch AI config:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await adminFetchJSON<any>("/api/admin/users");
      setUsers(data.users || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const generateLicense = async () => {
    const { plan, durationDays } = licenseForm;

    try {
      const data = await adminFetchJSON<any>(
        "/api/admin/license/create-no-email",
        {
          method: "POST",
          body: JSON.stringify({
            plan,
            durationDays,
          }),
        },
      );
      setGeneratedKey(data.license.key);
      fetchLicenses();
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const copyKeyToClipboard = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const deleteLicense = async (licenseId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette licence?")) return;

    try {
      setGeneratedLicenses(generatedLicenses.filter((l) => l.id !== licenseId));
      alert("Licence supprimée avec succès");
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const saveAIConfig = async () => {
    try {
      const updatedConfig = { ...aiConfig, ...aiConfigChanges };
      const data = await adminFetchJSON<any>("/api/admin/ai-config", {
        method: "POST",
        body: JSON.stringify(updatedConfig),
      });
      setAIConfig(data.config);
      setAIConfigEditing(false);
      setAIConfigChanges({});
      alert("Configuration IA sauvegardée");
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const banUser = async () => {
    if (!selectedUserEmail) {
      alert("Veuillez sélectionner un utilisateur");
      return;
    }

    try {
      await adminFetchJSON<any>("/api/admin/user/action", {
        method: "POST",
        body: JSON.stringify({
          email: selectedUserEmail,
          action: "ban",
          reason: banReason,
        }),
      });
      alert("Utilisateur banni avec succès");
      setSelectedUserEmail("");
      setBanReason("");
      fetchUsers();
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleMaintenanceToggle = async () => {
    try {
      await adminFetchJSON<any>("/api/admin/maintenance", {
        method: "POST",
        body: JSON.stringify({
          enabled: !maintenanceEnabled,
          message: maintenanceMessage,
        }),
      });
      setMaintenanceEnabled(!maintenanceEnabled);
      alert("Mode maintenance mis à jour");
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      {/* Header */}
      <div
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: "#000000", borderColor: "#1A1A1A" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Back to chat"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </button>
          <h1 className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>
            Admin Panel
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg font-semibold transition-colors"
          style={{
            backgroundColor: "#0A84FF",
            color: "#FFFFFF",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "#0070DD";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "#0A84FF";
          }}
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div
        className="border-b flex gap-8 px-6 overflow-x-auto"
        style={{ backgroundColor: "#0D0D0D", borderColor: "#1A1A1A" }}
      >
        {(
          ["overview", "licenses", "users", "ai-config", "maintenance"] as const
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 px-2 font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {tab === "overview" && "Aperçu"}
            {tab === "licenses" && "Licences"}
            {tab === "users" && "Utilisateurs"}
            {tab === "ai-config" && "Config IA"}
            {tab === "maintenance" && "Maintenance"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div>
              <h2
                className="text-2xl font-bold mb-8"
                style={{ color: "#FFFFFF" }}
              >
                Dashboard
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div
                  className="rounded-lg p-6 border"
                  style={{
                    backgroundColor: "#0D0D0D",
                    borderColor: "#1A1A1A",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: "#FFFFFF" }}
                    >
                      Total Users
                    </h3>
                    <Users size={24} color="#0A84FF" />
                  </div>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: "#0A84FF" }}
                  >
                    {stats.totalUsers}
                  </p>
                </div>

                <div
                  className="rounded-lg p-6 border"
                  style={{
                    backgroundColor: "#0D0D0D",
                    borderColor: "#1A1A1A",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: "#FFFFFF" }}
                    >
                      Active Subscriptions
                    </h3>
                    <BarChart3 size={24} color="#0A84FF" />
                  </div>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: "#0A84FF" }}
                  >
                    {stats.activeSubscriptions}
                  </p>
                </div>

                <div
                  className="rounded-lg p-6 border"
                  style={{
                    backgroundColor: "#0D0D0D",
                    borderColor: "#1A1A1A",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: "#FFFFFF" }}
                    >
                      Messages Used
                    </h3>
                    <Clock size={24} color="#0A84FF" />
                  </div>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: "#0A84FF" }}
                  >
                    {stats.totalMessagesUsed}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Licenses Tab */}
          {activeTab === "licenses" && (
            <div>
              <h2
                className="text-2xl font-bold mb-8"
                style={{ color: "#FFFFFF" }}
              >
                Gestion des Licences
              </h2>

              {/* Create License */}
              <div
                className="rounded-lg p-6 border mb-8"
                style={{
                  backgroundColor: "#0D0D0D",
                  borderColor: "#1A1A1A",
                }}
              >
                <h3
                  className="text-xl font-semibold mb-4"
                  style={{ color: "#FFFFFF" }}
                >
                  Créer une nouvelle licence
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#FFFFFF" }}
                      >
                        Plan
                      </label>
                      <select
                        value={licenseForm.plan}
                        onChange={(e) =>
                          setLicenseForm({
                            ...licenseForm,
                            plan: e.target.value as any,
                          })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
                      >
                        <option value="Gratuit">Gratuit</option>
                        <option value="Classic">Classic</option>
                        <option value="Pro">Pro</option>
                      </select>
                    </div>

                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#FFFFFF" }}
                      >
                        Durée (jours)
                      </label>
                      <input
                        type="number"
                        value={licenseForm.durationDays}
                        onChange={(e) =>
                          setLicenseForm({
                            ...licenseForm,
                            durationDays: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
                        min="1"
                        max="365"
                      />
                    </div>
                  </div>

                  <button
                    onClick={generateLicense}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Key size={20} />
                    Générer une clé
                  </button>
                </div>

                {generatedKey && (
                  <div className="mt-6 p-4 bg-green-950 border border-green-700 rounded-lg">
                    <p className="text-green-200 mb-2 font-semibold">
                      Clé générée avec succès:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-white bg-black px-3 py-2 rounded font-mono text-sm break-all">
                        {generatedKey}
                      </code>
                      <button
                        onClick={copyKeyToClipboard}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                      >
                        {copiedKey ? <Check size={20} /> : <Copy size={20} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Licenses List */}
              <div
                className="rounded-lg p-6 border"
                style={{
                  backgroundColor: "#0D0D0D",
                  borderColor: "#1A1A1A",
                }}
              >
                <h3
                  className="text-xl font-semibold mb-4"
                  style={{ color: "#FFFFFF" }}
                >
                  Licences Générées ({generatedLicenses.length})
                </h3>

                {generatedLicenses.length === 0 ? (
                  <p style={{ color: "#888888" }}>
                    Aucune licence générée pour le moment
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {generatedLicenses.map((license) => (
                      <div
                        key={license.id}
                        className="flex items-center justify-between p-3 bg-slate-900 rounded border border-slate-700"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-mono text-white break-all">
                            {license.key}
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: "#888888" }}
                          >
                            Plan: {license.plan} | Durée: {license.durationDays}
                            j | Expire:{" "}
                            {new Date(license.expiresAt).toLocaleDateString()}
                            {license.usedBy &&
                              ` | Utilisé par: ${license.usedBy}`}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteLicense(license.id)}
                          className="p-2 hover:bg-red-600/20 text-red-600 rounded transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div>
              <h2
                className="text-2xl font-bold mb-8"
                style={{ color: "#FFFFFF" }}
              >
                Gestion des Utilisateurs
              </h2>

              {/* Ban User Section */}
              <div
                className="rounded-lg p-6 border mb-8"
                style={{
                  backgroundColor: "#0D0D0D",
                  borderColor: "#1A1A1A",
                }}
              >
                <h3
                  className="text-xl font-semibold mb-4"
                  style={{ color: "#FFFFFF" }}
                >
                  Bannir un utilisateur
                </h3>

                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#FFFFFF" }}
                    >
                      Email de l'utilisateur
                    </label>
                    <input
                      type="email"
                      value={selectedUserEmail}
                      onChange={(e) => setSelectedUserEmail(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
                      placeholder="user@example.com"
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#FFFFFF" }}
                    >
                      Raison du ban
                    </label>
                    <textarea
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
                      placeholder="Motif du ban..."
                      rows={3}
                    />
                  </div>

                  <button
                    onClick={banUser}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Ban size={20} />
                    Bannir cet utilisateur
                  </button>
                </div>
              </div>

              {/* Users List */}
              <div
                className="rounded-lg p-6 border"
                style={{
                  backgroundColor: "#0D0D0D",
                  borderColor: "#1A1A1A",
                }}
              >
                <h3
                  className="text-xl font-semibold mb-4"
                  style={{ color: "#FFFFFF" }}
                >
                  Tous les utilisateurs ({users.length})
                </h3>

                {users.length === 0 ? (
                  <p style={{ color: "#888888" }}>Aucun utilisateur trouvé</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr
                          style={{ borderColor: "#1A1A1A" }}
                          className="border-b"
                        >
                          <th
                            className="text-left py-3 px-4"
                            style={{ color: "#FFFFFF" }}
                          >
                            Email
                          </th>
                          <th
                            className="text-left py-3 px-4"
                            style={{ color: "#FFFFFF" }}
                          >
                            Plan
                          </th>
                          <th
                            className="text-left py-3 px-4"
                            style={{ color: "#FFFFFF" }}
                          >
                            Messages
                          </th>
                          <th
                            className="text-left py-3 px-4"
                            style={{ color: "#FFFFFF" }}
                          >
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr
                            key={user.id}
                            style={{ borderColor: "#1A1A1A" }}
                            className="border-b hover:bg-slate-900/50"
                          >
                            <td
                              className="py-3 px-4"
                              style={{ color: "#FFFFFF" }}
                            >
                              {user.email}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className="px-2 py-1 rounded text-xs font-semibold"
                                style={{
                                  backgroundColor: "#0A84FF",
                                  color: "#FFFFFF",
                                }}
                              >
                                {user.plan}
                              </span>
                            </td>
                            <td
                              className="py-3 px-4"
                              style={{ color: "#888888" }}
                            >
                              {user.messageCount}/{user.messageLimit}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  user.isBanned
                                    ? "bg-red-600/20 text-red-400"
                                    : user.isSuspended
                                      ? "bg-yellow-600/20 text-yellow-400"
                                      : "bg-green-600/20 text-green-400"
                                }`}
                              >
                                {user.isBanned
                                  ? "Banni"
                                  : user.isSuspended
                                    ? "Suspendu"
                                    : "Actif"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Config Tab */}
          {activeTab === "ai-config" && (
            <div>
              <h2
                className="text-2xl font-bold mb-8"
                style={{ color: "#FFFFFF" }}
              >
                Configuration de l'IA
              </h2>

              <div
                className="rounded-lg p-6 border"
                style={{
                  backgroundColor: "#0D0D0D",
                  borderColor: "#1A1A1A",
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3
                    className="text-xl font-semibold"
                    style={{ color: "#FFFFFF" }}
                  >
                    Paramètres du modèle
                  </h3>
                  <button
                    onClick={() => {
                      if (aiConfigEditing) {
                        setAIConfigEditing(false);
                        setAIConfigChanges({});
                      } else {
                        setAIConfigEditing(true);
                      }
                    }}
                    className="px-4 py-2 rounded-lg font-semibold transition-colors"
                    style={{
                      backgroundColor: aiConfigEditing ? "#0A84FF" : "#444444",
                      color: "#FFFFFF",
                    }}
                  >
                    {aiConfigEditing ? "Annuler" : "Modifier"}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#FFFFFF" }}
                    >
                      Modèle IA
                    </label>
                    <input
                      type="text"
                      value={
                        aiConfigEditing
                          ? aiConfigChanges.model || aiConfig.model
                          : aiConfig.model
                      }
                      onChange={(e) =>
                        setAIConfigChanges({
                          ...aiConfigChanges,
                          model: e.target.value,
                        })
                      }
                      disabled={!aiConfigEditing}
                      className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white disabled:opacity-50"
                    />
                    <p className="text-xs mt-1" style={{ color: "#888888" }}>
                      Exemple: x-ai/grok-4.1-fast, gpt-4, claude-3-opus
                    </p>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#FFFFFF" }}
                    >
                      Température (0 - 1)
                    </label>
                    <input
                      type="number"
                      value={
                        aiConfigEditing
                          ? aiConfigChanges.temperature || aiConfig.temperature
                          : aiConfig.temperature
                      }
                      onChange={(e) =>
                        setAIConfigChanges({
                          ...aiConfigChanges,
                          temperature: parseFloat(e.target.value),
                        })
                      }
                      disabled={!aiConfigEditing}
                      className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white disabled:opacity-50"
                      min="0"
                      max="1"
                      step="0.1"
                    />
                    <p className="text-xs mt-1" style={{ color: "#888888" }}>
                      Plus élevé = plus créatif, plus bas = plus déterministe
                    </p>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#FFFFFF" }}
                    >
                      Max tokens
                    </label>
                    <input
                      type="number"
                      value={
                        aiConfigEditing
                          ? aiConfigChanges.maxTokens || aiConfig.maxTokens
                          : aiConfig.maxTokens
                      }
                      onChange={(e) =>
                        setAIConfigChanges({
                          ...aiConfigChanges,
                          maxTokens: parseInt(e.target.value),
                        })
                      }
                      disabled={!aiConfigEditing}
                      className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white disabled:opacity-50"
                      min="100"
                      max="4000"
                    />
                    <p className="text-xs mt-1" style={{ color: "#888888" }}>
                      Longueur maximale de la réponse
                    </p>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#FFFFFF" }}
                    >
                      Prompt système
                    </label>
                    <textarea
                      value={
                        aiConfigEditing
                          ? aiConfigChanges.systemPrompt ||
                            aiConfig.systemPrompt
                          : aiConfig.systemPrompt
                      }
                      onChange={(e) =>
                        setAIConfigChanges({
                          ...aiConfigChanges,
                          systemPrompt: e.target.value,
                        })
                      }
                      disabled={!aiConfigEditing}
                      className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white disabled:opacity-50"
                      rows={6}
                    />
                    <p className="text-xs mt-1" style={{ color: "#888888" }}>
                      Définit le comportement et la personnalité de l'IA
                    </p>
                  </div>

                  {aiConfigEditing && (
                    <button
                      onClick={saveAIConfig}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Check size={20} />
                      Sauvegarder les changements
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === "maintenance" && (
            <div>
              <h2
                className="text-2xl font-bold mb-8"
                style={{ color: "#FFFFFF" }}
              >
                Mode Maintenance
              </h2>

              <div
                className="rounded-lg p-6 border"
                style={{
                  backgroundColor: "#0D0D0D",
                  borderColor: "#1A1A1A",
                }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3
                        className="text-lg font-semibold"
                        style={{ color: "#FFFFFF" }}
                      >
                        Mode Maintenance Actif
                      </h3>
                      <p className="text-sm mt-1" style={{ color: "#888888" }}>
                        {maintenanceEnabled ? "Activé" : "Désactivé"}
                      </p>
                    </div>
                    <button
                      onClick={handleMaintenanceToggle}
                      className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                        maintenanceEnabled
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-green-600 hover:bg-green-700"
                      } text-white`}
                    >
                      <Power size={20} />
                      {maintenanceEnabled ? "Désactiver" : "Activer"}
                    </button>
                  </div>

                  <div className="border-t border-slate-700 pt-4">
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#FFFFFF" }}
                    >
                      Message de Maintenance
                    </label>
                    <textarea
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <p className="text-sm mt-4" style={{ color: "#888888" }}>
                💡 Conseil: Utilisez CTRL+F1 n'importe où dans l'application
                pour basculer rapidement le mode maintenance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
