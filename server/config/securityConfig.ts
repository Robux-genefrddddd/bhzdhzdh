export const securityConfig = {
  vpnDetection: {
    enabled: true,
    hardBlock: true,
    lockDurationHours: 24,
  },

  deviceFingerprinting: {
    enabled: true,
    multiDeviceBlock: true,
    allowedDevicesPerUser: 1,
  },

  ipGeolocation: {
    enabled: true,
    trackHistory: true,
    flagRapidChanges: true,
    rapidChangeThresholdHours: 24,
    allowAdjacentCountries: true,
  },

  accountLocking: {
    enabled: true,
    lockDurationHours: 24,
    triggers: [
      "vpn_detected",
      "suspicious_location",
      "new_device",
      "threat_detected",
      "repeated_violations",
    ],
  },

  permanentBans: {
    enabled: true,
    triggerAfterViolations: 3,
    blockBothIpAndDevice: true,
  },

  blockedExtensions: [
    "uBlock Origin",
    "Proxy SwitchyOmega",
    "ExpressVPN",
    "NordVPN",
    "Surfshark",
    "CyberGhost",
    "Windscribe",
    "Private Internet Access",
    "IPVanish",
    "TorBrowser",
  ],

  errorMessages: {
    vpn: "Veuillez désactiver votre VPN pour utiliser la plateforme. Pour des raisons de sécurité, les VPN ne sont pas autorisés, même légitimes.",
    threat:
      "Votre adresse IP a été identifiée comme suspecte. Veuillez réessayer plus tard.",
    locationChange:
      "Changement de localisation détecté. Votre compte a été verrouillé pendant 24 heures. Veuillez vérifier votre email.",
    newDevice:
      "Nouvel appareil détecté. Votre compte a été verrouillé pendant 24 heures. Veuillez vérifier votre email.",
    accountLocked:
      "Votre compte est actuellement verrouillé. Veuillez réessayer dans quelques heures.",
    ipBlocked:
      "Votre adresse IP a été bloquée en raison d'une activité suspecte.",
    deviceBlocked:
      "Votre appareil a été bloqué en raison d'une activité suspecte.",
  },
};
