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
} from "lucide-react";
import { LicensePlan, AdminLicenseCreate, AdminUserAction } from "@shared/api";
import { LicenseManager } from "@/lib/licenseManager";

const ADMIN_EMAILS = ["founder@example.com", "jo.m.efarit.1.4@gmail.com"];

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalMessagesUsed: number;
}

interface UserManagementState {
  selectedEmail: string;
  action: "warn" | "suspend" | "ban" | "unban" | "reactivate" | null;
  reason: string;
}

export default function AdminPanel() {
  const { user, logout, maintenanceMode } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalMessagesUsed: 0,
  });

  const [activeTab, setActiveTab] = useState<
    "overview" | "licenses" | "users" | "maintenance"
  >("overview");

  const [licenseForm, setLicenseForm] = useState({
    email: "",
    plan: "Classic" as LicensePlan,
    durationDays: 30,
  });

  const [userManagement, setUserManagement] = useState<UserManagementState>({
    selectedEmail: "",
    action: null,
    reason: "",
  });

  const [generatedKey, setGeneratedKey] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(maintenanceMode);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "La plateforme est actuellement en maintenance. Veuillez réessayer plus tard.",
  );

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!ADMIN_EMAILS.includes(user.email)) {
      navigate("/");
      return;
    }
  }, [user, navigate]);

  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const generateLicenseKey = async () => {
    const { email, plan, durationDays } = licenseForm;

    if (!email) {
      alert("Veuillez entrer une adresse email");
      return;
    }

    try {
      const response = await fetch("/api/admin/license/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          plan,
          durationDays,
        } as AdminLicenseCreate),
      });

      if (!response.ok) {
        throw new Error("Failed to generate license key");
      }

      const data = await response.json();
      setGeneratedKey(data.key);
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleUserAction = async () => {
    const { selectedEmail, action, reason } = userManagement;

    if (!selectedEmail || !action) {
      alert("Veuillez sélectionner une email et une action");
      return;
    }

    try {
      const response = await fetch("/api/admin/user/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedEmail,
          action,
          reason,
        } as AdminUserAction),
      });

      if (!response.ok) {
        throw new Error("Failed to perform user action");
      }

      alert(`Action effectuée: ${action}`);
      setUserManagement({ selectedEmail: "", action: null, reason: "" });
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleMaintenanceToggle = async () => {
    try {
      const response = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: !maintenanceEnabled,
          message: maintenanceMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update maintenance mode");
      }

      setMaintenanceEnabled(!maintenanceEnabled);
      alert("Mode maintenance mis à jour");
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const copyKeyToClipboard = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
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
        className="border-b flex gap-8 px-6"
        style={{ backgroundColor: "#0D0D0D", borderColor: "#1A1A1A" }}
      >
        {(["overview", "licenses", "users", "maintenance"] as const).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {tab === "overview" && "Aperçu"}
              {tab === "licenses" && "Licences"}
              {tab === "users" && "Utilisateurs"}
              {tab === "maintenance" && "Maintenance"}
            </button>
          ),
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
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
                  Créer une nouvelle clé de licence
                </h3>

                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#FFFFFF" }}
                    >
                      Email Utilisateur
                    </label>
                    <input
                      type="email"
                      value={licenseForm.email}
                      onChange={(e) =>
                        setLicenseForm({
                          ...licenseForm,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
                      placeholder="user@example.com"
                    />
                  </div>

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
                            plan: e.target.value as LicensePlan,
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
                    onClick={generateLicenseKey}
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
                        {LicenseManager.formatLicenseKey(generatedKey)}
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
                  Actions sur les utilisateurs
                </h3>

                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#FFFFFF" }}
                    >
                      Email Utilisateur
                    </label>
                    <input
                      type="email"
                      value={userManagement.selectedEmail}
                      onChange={(e) =>
                        setUserManagement({
                          ...userManagement,
                          selectedEmail: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
                      placeholder="user@example.com"
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#FFFFFF" }}
                    >
                      Action
                    </label>
                    <select
                      value={userManagement.action || ""}
                      onChange={(e) =>
                        setUserManagement({
                          ...userManagement,
                          action: (e.target.value || null) as any,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
                    >
                      <option value="">Sélectionner une action</option>
                      <option value="warn">Avertir</option>
                      <option value="suspend">Suspendre</option>
                      <option value="ban">Bannir</option>
                      <option value="unban">Débannir</option>
                      <option value="reactivate">Réactiver</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#FFFFFF" }}
                    >
                      Raison (optionnel)
                    </label>
                    <textarea
                      value={userManagement.reason}
                      onChange={(e) =>
                        setUserManagement({
                          ...userManagement,
                          reason: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
                      placeholder="Motif de l'action..."
                      rows={3}
                    />
                  </div>

                  <button
                    onClick={handleUserAction}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <AlertTriangle size={20} />
                    Appliquer l'action
                  </button>
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
