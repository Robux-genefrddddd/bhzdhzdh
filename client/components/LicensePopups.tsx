import { useEffect, useState } from "react";
import { Warning, SecurityAlert } from "@shared/api";
import { X, AlertTriangle, Info, Clock } from "lucide-react";

interface LicensePopupsProps {
  warnings: Warning[];
  alerts: SecurityAlert[];
  onDismiss: (id: string) => void;
  onAction?: (action: string) => void;
}

export default function LicensePopups({
  warnings,
  alerts,
  onDismiss,
  onAction,
}: LicensePopupsProps) {
  const [displayedAlerts, setDisplayedAlerts] = useState<SecurityAlert[]>([]);

  useEffect(() => {
    setDisplayedAlerts(alerts);
  }, [alerts]);

  const handleDismiss = (index: number) => {
    const newAlerts = displayedAlerts.filter((_, i) => i !== index);
    setDisplayedAlerts(newAlerts);
  };

  const getCriticalAlerts = () =>
    displayedAlerts.filter((a) => a.severity === "critical");
  const getWarningAlerts = () =>
    displayedAlerts.filter((a) => a.severity === "warning");
  const getInfoAlerts = () =>
    displayedAlerts.filter((a) => a.severity === "info");

  const criticalAlerts = getCriticalAlerts();
  const warningAlerts = getWarningAlerts();
  const infoAlerts = getInfoAlerts();

  return (
    <>
      {criticalAlerts.map((alert, index) => (
        <div
          key={`critical-${index}`}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <div
            className="bg-red-950 border border-red-700 rounded-lg p-6 max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white mb-2">
                  {alert.title}
                </h2>
                <p className="text-red-100 mb-4">{alert.message}</p>
                <div className="flex gap-2">
                  {alert.action && (
                    <button
                      onClick={() => {
                        onAction?.(alert.action?.url || alert.action?.label);
                        handleDismiss(displayedAlerts.indexOf(alert));
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold transition-colors"
                    >
                      {alert.action.label}
                    </button>
                  )}
                  {alert.dismissible && (
                    <button
                      onClick={() => {
                        handleDismiss(displayedAlerts.indexOf(alert));
                      }}
                      className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-md font-semibold transition-colors"
                    >
                      Fermer
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {warningAlerts.map((alert, index) => (
        <div
          key={`warning-${index}`}
          className="fixed top-4 right-4 bg-yellow-950 border border-yellow-700 rounded-lg p-4 max-w-sm shadow-lg z-40"
        >
          <div className="flex items-start gap-3">
            <Clock className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-white">{alert.title}</h3>
              <p className="text-yellow-100 text-sm mt-1">{alert.message}</p>
              {alert.dismissible && (
                <button
                  onClick={() => {
                    handleDismiss(displayedAlerts.indexOf(alert));
                  }}
                  className="text-yellow-400 hover:text-yellow-300 text-xs font-semibold mt-2 underline"
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {infoAlerts.map((alert, index) => (
        <div
          key={`info-${index}`}
          className="fixed bottom-4 left-4 bg-blue-950 border border-blue-700 rounded-lg p-4 max-w-sm shadow-lg z-40"
        >
          <div className="flex items-start gap-3">
            <Info className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-white">{alert.title}</h3>
              <p className="text-blue-100 text-sm mt-1">{alert.message}</p>
              {alert.dismissible && (
                <button
                  onClick={() => {
                    handleDismiss(displayedAlerts.indexOf(alert));
                  }}
                  className="text-blue-400 hover:text-blue-300 text-xs font-semibold mt-2 underline"
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
