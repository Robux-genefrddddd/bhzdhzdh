import { RequestHandler } from "express";

interface SecurityCheckRequest {
  email: string;
  deviceFingerprint: string;
  isRegister?: boolean;
}

interface SecurityRecord {
  email: string;
  deviceFingerprint: string;
  ip: string;
  country: string;
  isVpn: boolean;
  timestamp: string;
  locked: boolean;
  lockedUntil?: string;
}

interface BlockedEntry {
  ip?: string;
  deviceFingerprint?: string;
  reason: string;
  permanent: boolean;
}

const securityDatabase = new Map<string, SecurityRecord[]>();
const blockedList = new Map<string, BlockedEntry[]>();
const deviceDatabase = new Map<string, string[]>();
const accountLocks = new Map<string, { lockedUntil: number; reason: string }>();

const getClientIp = (req: any): string => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    "unknown"
  );
};

const checkVpnWithIp2Proxy = async (
  ip: string,
): Promise<{
  isVpn: boolean;
  country: string;
  proxy: boolean;
  threat: boolean;
}> => {
  const apiKey = process.env.IP2PROXY_API_KEY;
  if (!apiKey) {
    console.warn("IP2Proxy API key not configured");
    return {
      isVpn: false,
      country: "UNKNOWN",
      proxy: false,
      threat: false,
    };
  }

  try {
    const response = await fetch(
      `https://api.ip2proxy.com/v2/?key=${apiKey}&ip=${ip}&format=json`,
    );

    if (!response.ok) {
      console.error("IP2Proxy API error:", response.statusText);
      return {
        isVpn: false,
        country: "UNKNOWN",
        proxy: false,
        threat: false,
      };
    }

    const data = await response.json();

    const isVpn =
      data.is_proxy === "Yes" &&
      (data.proxy_type === "VPN" ||
        data.proxy_type === "Proxy" ||
        data.proxy_type === "Tor");
    const isThreat =
      data.threat_level === "High" || data.threat_level === "Medium";

    return {
      isVpn,
      country: data.country_code || "UNKNOWN",
      proxy: data.is_proxy === "Yes",
      threat: isThreat,
    };
  } catch (error) {
    console.error("Error checking VPN:", error);
    return {
      isVpn: false,
      country: "UNKNOWN",
      proxy: false,
      threat: false,
    };
  }
};

const isIpBlocked = (ip: string): boolean => {
  const blocked = blockedList.get("ip") || [];
  return blocked.some((entry) => entry.ip === ip && entry.permanent);
};

const isDeviceBlocked = (fingerprint: string): boolean => {
  const blocked = blockedList.get("device") || [];
  return blocked.some(
    (entry) => entry.deviceFingerprint === fingerprint && entry.permanent,
  );
};

const getLastLogin = (email: string): SecurityRecord | undefined => {
  const records = securityDatabase.get(email);
  return records ? records[records.length - 1] : undefined;
};

const calculateCountryDistance = (
  country1: string,
  country2: string,
): boolean => {
  const neighbors: Record<string, string[]> = {
    US: ["CA", "MX"],
    CA: ["US"],
    MX: ["US", "GT", "BZ"],
    FR: ["DE", "IT", "ES", "BE", "LU", "CH"],
    DE: ["FR", "BE", "NL", "DK", "PL", "CZ", "AT", "CH"],
    GB: ["IE", "FR"],
    ES: ["FR", "PT", "AD"],
    IT: ["FR", "CH", "AT", "SL"],
    BE: ["FR", "NL", "DE", "LU"],
    NL: ["BE", "DE"],
    CH: ["DE", "FR", "IT", "AT", "LI"],
    AT: ["DE", "CZ", "SK", "HU", "SI", "IT", "CH"],
    JP: ["KR"],
    KR: ["JP", "CN", "RU"],
    CN: ["KR", "RU", "VN", "LA", "MM", "NP", "BT", "IN"],
    RU: [
      "CN",
      "KR",
      "MN",
      "KZ",
      "UZ",
      "TM",
      "AZ",
      "GE",
      "UA",
      "BY",
      "PL",
      "LT",
      "LV",
      "EE",
    ],
    AU: ["NZ"],
    NZ: ["AU"],
  };

  return neighbors[country1]?.includes(country2) || false;
};

export const handleSecurityCheck: RequestHandler = async (req, res) => {
  try {
    const { email, deviceFingerprint, isRegister } =
      req.body as SecurityCheckRequest;

    if (!email || !deviceFingerprint) {
      return res.status(400).json({
        allowed: false,
        message: "Email and device fingerprint are required",
      });
    }

    const clientIp = getClientIp(req);

    if (isIpBlocked(clientIp)) {
      return res.status(403).json({
        allowed: false,
        message:
          "Votre adresse IP a été bloquée en raison d'une activité suspecte.",
        type: "ip_blocked",
      });
    }

    if (isDeviceBlocked(deviceFingerprint)) {
      return res.status(403).json({
        allowed: false,
        message:
          "Votre appareil a été bloqué en raison d'une activité suspecte.",
        type: "device_blocked",
      });
    }

    const accountLock = accountLocks.get(email);
    if (accountLock && accountLock.lockedUntil > Date.now()) {
      const remainingMinutes = Math.ceil(
        (accountLock.lockedUntil - Date.now()) / 60000,
      );
      return res.status(403).json({
        allowed: false,
        message: `Votre compte est verrouillé pour ${remainingMinutes} minutes. Raison: ${accountLock.reason}`,
        type: "account_locked",
      });
    }

    const vpnCheck = await checkVpnWithIp2Proxy(clientIp);

    if (vpnCheck.isVpn || vpnCheck.proxy) {
      accountLocks.set(email, {
        lockedUntil: Date.now() + 24 * 60 * 60 * 1000,
        reason: "VPN/Proxy detected",
      });

      const blocked = blockedList.get("ip") || [];
      blocked.push({
        ip: clientIp,
        reason: "VPN/Proxy detected",
        permanent: false,
      });
      blockedList.set("ip", blocked);

      return res.status(403).json({
        allowed: false,
        message:
          "Veuillez désactiver votre VPN pour utiliser la plateforme. Pour des raisons de sécurité, les VPN ne sont pas autorisés, même légitimes.",
        type: "vpn",
      });
    }

    if (vpnCheck.threat) {
      accountLocks.set(email, {
        lockedUntil: Date.now() + 24 * 60 * 60 * 1000,
        reason: "Suspicious IP detected",
      });

      return res.status(403).json({
        allowed: false,
        message:
          "Votre adresse IP a été identifiée comme suspecte. Veuillez réessayer plus tard.",
        type: "threat",
      });
    }

    if (!isRegister) {
      const lastLogin = getLastLogin(email);

      if (lastLogin) {
        const timeDiff = Date.now() - new Date(lastLogin.timestamp).getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (lastLogin.country !== vpnCheck.country && hoursDiff < 24) {
          const isAdjacent = calculateCountryDistance(
            lastLogin.country,
            vpnCheck.country,
          );

          if (!isAdjacent) {
            accountLocks.set(email, {
              lockedUntil: Date.now() + 24 * 60 * 60 * 1000,
              reason: "Suspicious location change",
            });

            return res.status(403).json({
              allowed: false,
              message:
                "Changement de localisation détecté. Votre compte a été verrouillé pendant 24 heures. Veuillez vérifier votre email.",
              type: "location_change",
            });
          }
        }

        if (lastLogin.deviceFingerprint !== deviceFingerprint) {
          const deviceHistory = deviceDatabase.get(email) || [];

          if (deviceHistory.includes(deviceFingerprint)) {
            deviceHistory.push(deviceFingerprint);
            deviceDatabase.set(email, deviceHistory);
          } else if (deviceHistory.length > 0) {
            accountLocks.set(email, {
              lockedUntil: Date.now() + 24 * 60 * 60 * 1000,
              reason: "New device detected",
            });

            return res.status(403).json({
              allowed: false,
              message:
                "Nouvel appareil détecté. Votre compte a été verrouillé pendant 24 heures. Veuillez vérifier votre email.",
              type: "new_device",
            });
          }
        }
      }

      const history = securityDatabase.get(email) || [];
      history.push({
        email,
        deviceFingerprint,
        ip: clientIp,
        country: vpnCheck.country,
        isVpn: vpnCheck.isVpn,
        timestamp: new Date().toISOString(),
        locked: false,
      });
      securityDatabase.set(email, history);
    } else {
      const existingDevices = deviceDatabase.get(email) || [];
      existingDevices.push(deviceFingerprint);
      deviceDatabase.set(email, existingDevices);

      securityDatabase.set(email, [
        {
          email,
          deviceFingerprint,
          ip: clientIp,
          country: vpnCheck.country,
          isVpn: false,
          timestamp: new Date().toISOString(),
          locked: false,
        },
      ]);
    }

    res.json({
      allowed: true,
      message: "Security check passed",
    });
  } catch (error) {
    console.error("Security check error:", error);
    res.status(500).json({
      allowed: false,
      message: "Security check failed",
    });
  }
};
