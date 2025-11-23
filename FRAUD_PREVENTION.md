# 🔒 Fraud Prevention System Documentation

## Overview

This application implements a comprehensive fraud prevention system designed to prevent abuse, multi-accounting, and circumvention attempts. The system uses multiple detection layers working in tandem to ensure security.

## Key Components

### 1. **Device Fingerprinting**

- **File**: `client/lib/deviceFingerprint.ts`
- **Technology**: Fingerprint2 (FingerprintJS)
- **Purpose**: Generate unique device identifiers based on browser characteristics
- **Features**:
  - Canvas fingerprinting
  - WebGL fingerprinting
  - Timezone detection
  - Language detection
  - Screen resolution hashing
  - Plugin detection

### 2. **VPN/Proxy Detection**

- **File**: `server/routes/security.ts`
- **Service**: IP2Proxy LITE API
- **API Key**: Set via environment variable `IP2PROXY_API_KEY`
- **Detection Methods**:
  - Residential proxy detection
  - VPN service detection
  - Tor network detection
  - Data center proxy detection
  - Threat level assessment

### 3. **IP Geolocation Tracking**

- **File**: `server/routes/security.ts`
- **Purpose**: Track user location and detect suspicious patterns
- **Features**:
  - Country-level IP geolocation
  - Login location history per account
  - Rapid location change detection
  - Adjacent country allowance for legitimate travel

### 4. **Browser Extension Detection**

- **File**: `client/lib/securityCheck.ts`
- **Purpose**: Detect proxy and anonymization browser extensions
- **Blocked Extensions**:
  - VPN extensions (ExpressVPN, NordVPN, Surfshark, etc.)
  - Proxy switchers
  - Anonymization tools
  - Note: Regular ad blockers (uBlock) are allowed

## Security Policies

### Hard Block: VPN/Proxy Detection

```
Trigger: VPN, proxy, or Tor detected
Action: IMMEDIATE BLOCK
Duration: 24 hours
Message: "Veuillez désactiver votre VPN pour utiliser la plateforme..."
```

### Hard Block: Suspicious Threat Level

```
Trigger: IP marked as threat by IP2Proxy
Action: IMMEDIATE BLOCK
Duration: 24 hours
```

### Device Fingerprinting Validation

```
Trigger: New device detected on existing account
Action: LOCK ACCOUNT for 24 hours
Message: "Nouvel appareil détecté..."
```

### Rapid Location Change

```
Trigger: Impossible travel detected (country change < 24 hours)
Action: LOCK ACCOUNT for 24 hours
Message: "Changement de localisation détecté..."
Exceptions: Adjacent countries allowed
```

### Permanent Bans

```
Trigger: 3+ repeated violations
Action: PERMANENT BAN
Blocks:
  - IP address (all future attempts)
  - Device fingerprint (all future attempts)
Duration: Permanent
```

## API Endpoints

### POST `/api/security/check`

Performs comprehensive security validation before login/register.

**Request Body**:

```json
{
  "email": "user@example.com",
  "deviceFingerprint": "hashed_fingerprint",
  "isRegister": false
}
```

**Success Response** (200):

```json
{
  "allowed": true,
  "message": "Security check passed"
}
```

**Blocked Response** (403):

```json
{
  "allowed": false,
  "message": "Veuillez désactiver votre VPN...",
  "type": "vpn"
}
```

**Types**:

- `vpn` - VPN/proxy detected
- `threat` - Suspicious IP
- `location_change` - Impossible travel
- `new_device` - New device on account
- `account_locked` - Account temporarily locked
- `ip_blocked` - IP permanently banned
- `device_blocked` - Device permanently banned

## Integration Points

### Client-Side (Login/Register)

1. **Before submit**: Call `getDeviceFingerprint()`
2. **On submit**: Call `checkSecurityBeforeAuth(email, isRegister)`
3. **If blocked**: Display error message and prevent auth attempt

### Server-Side (Auth)

1. **AuthContext** validates security before Firebase auth
2. **Security endpoint** returns detailed error messages
3. **Database**: Tracks all login attempts with IP, device, country

## Data Retention

- **Login History**: Stored indefinitely per account
- **Device History**: Tracked per account
- **IP Blocks**: Permanent until manual removal
- **Account Locks**: Auto-unlock after 24 hours
- **Device Blocks**: Permanent until manual removal

## Configuration

**File**: `server/config/securityConfig.ts`

Customize:

- Lock duration
- Adjacent countries allowed
- Extension blocklist
- Error messages

## Environment Variables Required

```
IP2PROXY_API_KEY=your_api_key_here
```

Get your free IP2Proxy API key at: https://www.ip2proxy.com/

## Testing Fraud Prevention

### Test VPN Block

1. Connect to a VPN
2. Try to login/register
3. Should see: "Veuillez désactiver votre VPN..."

### Test Device Change

1. Register with Device A
2. Try to login from Device B
3. Should be locked for 24 hours

### Test Location Jump

1. Last login from France (FI)
2. Attempt login from Japan (JP)
3. Should be locked for 24 hours

### Test Permanent Ban

1. Trigger 3+ violations on same IP
2. All future attempts from that IP → Permanent block

## Security Best Practices

### What This System Prevents

✅ VPN/proxy abuse  
✅ Multi-accounting from one device  
✅ Impossible travel detection  
✅ Malicious IP blocking  
✅ Permanent bans on repeat offenders

### What This System Does NOT Prevent

❌ Password brute force (add rate limiting)  
❌ Credential stuffing (add CAPTCHA)  
❌ Social engineering  
❌ Phishing

### Recommendations

1. **Add CAPTCHA**: Use reCAPTCHA v3 on auth endpoints
2. **Rate Limiting**: Implement exponential backoff on failed attempts
3. **Email Verification**: Send notification on new device/location
4. **2FA/MFA**: Add two-factor authentication
5. **IP Reputation**: Subscribe to threat intelligence feeds
6. **Monitoring**: Log all security events for analysis

## Troubleshooting

### "API key not configured"

- Set `IP2PROXY_API_KEY` environment variable
- Restart dev server

### Legitimate users blocked

- Check "Adjacent Countries" setting
- Review error type in response
- Whitelist if needed (add to database)

### False positives with travel

- Extend adjacent country list in config
- Increase location change threshold hours
- Add manual whitelist mechanism

## Files Modified/Created

**New Files**:

- `client/lib/deviceFingerprint.ts` - Device ID generation
- `client/lib/securityCheck.ts` - Client security utilities
- `server/routes/security.ts` - Security check endpoint
- `server/config/securityConfig.ts` - Configuration

**Modified Files**:

- `server/index.ts` - Added security endpoint
- `client/context/AuthContext.tsx` - Integrated security checks
- `.env` - Added IP2Proxy configuration

## Support

For issues with IP2Proxy API:

- Visit: https://www.ip2proxy.com/support
- Documentation: https://www.ip2proxy.com/developer

For device fingerprinting issues:

- Visit: https://github.com/fingerprintjs

## Summary

This comprehensive fraud prevention system provides **hard blocking** of VPNs, **device tracking**, **location anomaly detection**, and **permanent banning** of repeat offenders. It's designed to be strict, transparent, and effective at preventing abuse while maintaining a clear user experience with localized French error messages.
