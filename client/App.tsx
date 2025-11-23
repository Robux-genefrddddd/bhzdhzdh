import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import AdminPanel from "./pages/AdminPanel";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import LicensePopups from "./components/LicensePopups";
import LicenseActivationModal from "./components/LicenseActivationModal";
import MaintenanceModeOverlay from "./components/MaintenanceModeOverlay";
import { useEffect, useState } from "react";
import { AntiBypass } from "./lib/antiBypass";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#000000",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "3px solid #333333",
            borderTopColor: "#0A84FF",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/register" />;
};

const AppRoutes = () => {
  const { warnings, alerts, maintenanceMode, user, verifyLicense } = useAuth();
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const isAdmin = user?.email === "founder@example.com" || user?.email === "jo.m.efarit.1.4@gmail.com";

  useEffect(() => {
    AntiBypass.initializeAllProtections();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "F1") {
        e.preventDefault();
        if (isAdmin) {
          setShowAdminPanel(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const licenseCheckInterval = setInterval(async () => {
      if (user) {
        await verifyLicense();
      }
    }, 60000);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(licenseCheckInterval);
    };
  }, [user, verifyLicense, isAdmin]);

  if (showAdminPanel && isAdmin) {
    return (
      <div>
        <AdminPanel />
        <button
          onClick={() => setShowAdminPanel(false)}
          className="fixed top-4 right-4 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded z-[2000]"
        >
          Close
        </button>
      </div>
    );
  }

  if (maintenanceMode && !showAdminPanel) {
    return (
      <>
        <Routes>
          <Route path="/admin-panel" element={<AdminPanel />} />
          <Route path="*" element={<MaintenanceModeOverlay />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      {user && (
        <>
          <LicensePopups
            warnings={warnings}
            alerts={alerts}
            onDismiss={() => {}}
            onAction={(action) => {
              if (action.includes("renew")) {
                setShowLicenseModal(true);
              }
            }}
          />
          {showLicenseModal && user?.email && (
            <LicenseActivationModal
              email={user.email}
              deviceId={user.id}
              onActivationSuccess={() => {
                setShowLicenseModal(false);
                verifyLicense();
              }}
              onClose={() => setShowLicenseModal(false)}
            />
          )}
        </>
      )}

      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="/admin-panel" element={<AdminPanel />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
