import { getDeviceFingerprint } from "./deviceFingerprint";

export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  type?: "vpn" | "device" | "ip_change" | "extension" | "blocked";
}

export interface SecurityCheckRequest {
  email: string;
  deviceFingerprint: string;
}

export const checkSecurityBeforeAuth = async (
  email: string,
  isRegister: boolean = false,
): Promise<SecurityCheckResult> => {
  try {
    const fingerprint = await getDeviceFingerprint();

    const response = await fetch("/api/security/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        deviceFingerprint: fingerprint.fingerprint,
        isRegister,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        allowed: false,
        reason: data.message || "Security check failed",
        type: data.type || "blocked",
      };
    }

    return data;
  } catch (error) {
    console.error("Security check error:", error);
    return {
      allowed: false,
      reason: "Unable to verify security. Please try again.",
      type: "blocked",
    };
  }
};

export const detectBrowserExtensions = (): string[] => {
  const extensions: string[] = [];

  const suspiciousExtensions = [
    { name: "uBlock Origin", id: "cjpalhdlnbpafiamejdnhcpgccdnjbgj" },
    { name: "Proxy SwitchyOmega", id: "padekgcemlokbadohgkichalifbchfid" },
    { name: "ExpressVPN", id: "fgddmllnllkalaagkghckoinaemmogpe" },
    { name: "NordVPN", id: "fjoalegetlsflcbfnmjkbjkngmdhljgg" },
    { name: "Surfshark", id: "klbibkeccnyohtwfmfcebalnhnhiiina" },
    { name: "CyberGhost", id: "lnfpkdhkpknfdljfdnccagfifnilbbkb" },
    { name: "Windscribe", id: "kfffakakmofflkpejakeikficjfjlmck" },
  ];

  suspiciousExtensions.forEach((ext) => {
    const img = document.createElement("img");
    img.src = `chrome-extension://${ext.id}/manifest.json`;
    img.onerror = () => {};
    img.onload = () => {
      extensions.push(ext.name);
    };
  });

  return extensions;
};
