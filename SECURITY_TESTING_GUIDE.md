# 🧪 Security Testing Guide

## Quick Test Scenarios

### Scenario 1: VPN Bypass Prevention ✅

**Objective**: Verify VPN detection blocks login attempts

**Steps**:

1. Connect to any VPN service
2. Go to login/register page
3. Try to log in with valid credentials
4. **Expected**: Blocked with message "Veuillez désactiver votre VPN..."

**What It Tests**:

- IP2Proxy VPN detection working
- Hard block enforcement
- French error message display

---

### Scenario 2: Device Fingerprinting ✅

**Objective**: Verify new device detection blocks login

**Prerequisites**:

- Account created on Device A

**Steps**:

1. From Device A: Register account with test@example.com
2. Switch to Device B (different browser/computer)
3. Try to login with test@example.com
4. **Expected**: Blocked with "Nouvel appareil détecté..."
5. Try again after 24 hours: Should work

**What It Tests**:

- Fingerprint generation working
- Device tracking enabled
- 24-hour lock enforcement

---

### Scenario 3: Location Anomaly Detection ✅

**Objective**: Verify impossible travel detection

**Prerequisites**:

- IP2Proxy API key configured
- Access to 2 different countries' IPs

**Steps**:

1. Login from France (French IP)
2. Wait < 1 minute
3. Switch to Japan IP (via VPN... wait, that's blocked 😄)
   - Alternative: Use proxy that's not detected as VPN
4. Try to login
5. **Expected**: Blocked with "Changement de localisation..."
6. Try again after 24 hours: Should work

**What It Tests**:

- IP geolocation working
- Rapid location change detection
- Time-based validation

---

### Scenario 4: Permanent Ban After Violations ✅

**Objective**: Verify permanent IP ban after 3 violations

**Steps**:

1. From IP A: Attempt 3+ violations
   - Try VPN login
   - Try new device
   - Try location change
2. Wait for 24-hour locks
3. Attempt 4th login from same IP
4. **Expected**: Permanent block (won't unlock after 24h)

**What It Tests**:

- Violation tracking
- Permanent ban trigger
- IP-based blocking

---

## Debug Tools

### Check Fingerprint Generation

Open browser console and run:

```javascript
import { getDeviceFingerprint } from "@/lib/deviceFingerprint";

getDeviceFingerprint().then((fp) => {
  console.log("Device Fingerprint:", fp.fingerprint);
  console.log("Components:", fp.components);
});
```

### Monitor Security Checks

Add to browser console network tab:

```javascript
// Before submitting login form:
console.log("About to check security for:", email);

// Network tab will show POST to /api/security/check
// Check response for detailed information
```

### View Security Endpoint Response

In DevTools Network tab:

1. Go to login page
2. Open Network tab
3. Try to login
4. Filter for `/api/security/check`
5. Click on request
6. View Response tab for details

**Sample Response** (if blocked):

```json
{
  "allowed": false,
  "message": "Veuillez désactiver votre VPN...",
  "type": "vpn"
}
```

---

## Testing Checklist

### Basic Functionality

- [ ] Login page loads without errors
- [ ] Register page loads without errors
- [ ] Console shows no JavaScript errors

### VPN Detection

- [ ] VPN detected and blocked
- [ ] Error message in French displayed
- [ ] User cannot proceed after VPN block

### Device Fingerprinting

- [ ] Different devices generate different fingerprints
- [ ] Same device always generates same fingerprint
- [ ] New device detected on repeat login

### Location Tracking

- [ ] IP geolocation working (check IP2Proxy API)
- [ ] Country codes captured correctly
- [ ] Location changes flagged within 24 hours

### Account Locking

- [ ] Account locks for 24 hours on violation
- [ ] Lock automatically expires after 24 hours
- [ ] User can login again after unlock

---

## Debugging Tips

### If VPN Not Detected

1. **Check IP2Proxy API Key**:

   ```bash
   echo $IP2PROXY_API_KEY
   ```

2. **Test API Directly**:

   ```bash
   curl "https://api.ip2proxy.com/v2/?key=YOUR_KEY&ip=YOUR_IP&format=json"
   ```

3. **Check Server Logs**:
   - Look for "Error checking VPN:" messages
   - Verify API response format

### If Fingerprints Not Matching

1. **Enable Fingerprint Logging**:

   ```javascript
   // In deviceFingerprint.ts:
   console.log("Generated fingerprint:", fingerprint);
   ```

2. **Check Browser Cache**:
   - Clear localStorage: `localStorage.clear()`
   - Clear sessionStorage: `sessionStorage.clear()`
   - Reload page

3. **Verify Fingerprint2 Library**:
   ```javascript
   console.log("Fingerprint2 version:", Fingerprint2.version);
   ```

### If Location Detection Not Working

1. **Verify IP Data**:

   ```javascript
   // Add to security.ts:
   console.log("IP check result:", vpnCheck);
   console.log("Country:", vpnCheck.country);
   ```

2. **Test IP Geolocation Service**:
   - Use public IP: `8.8.8.8` (Google - USA)
   - Use VPN IP and confirm it's blocked
   - Check geolocation accuracy

---

## Performance Testing

### Load Time Impact

- Device fingerprinting: ~500-1000ms (async, cached after first use)
- Security check: ~500ms (IP2Proxy API call)
- Total auth latency: ~1-2s additional

### Optimization Tips

1. **Cache fingerprint**: Already cached in memory ✅
2. **Parallel requests**: Make security check in parallel with auth
3. **Rate limit**: Add request throttling to prevent abuse

---

## Security Validation

### What Should Be Protected

✅ **VPN Users**: Completely blocked  
✅ **New Devices**: Locked for 24h  
✅ **Rapid Travel**: Locked for 24h  
✅ **Malicious IPs**: Blocked immediately  
✅ **Repeat Offenders**: Permanent ban

### What's NOT Protected

❌ Password guessing (implement rate limiting)  
❌ Credential stuffing (implement CAPTCHA)  
❌ Account enumeration (validate emails carefully)  
❌ Session hijacking (add HTTPS-only cookies)

---

## Common Issues & Solutions

| Issue                             | Cause                         | Solution                                      |
| --------------------------------- | ----------------------------- | --------------------------------------------- |
| "IP2Proxy API key not configured" | Missing env var               | Set `IP2PROXY_API_KEY` and restart            |
| All users blocked as VPN          | API returning false positives | Check IP2Proxy dashboard, whitelist if needed |
| Fingerprints not matching         | Cache cleared                 | Check browser storage, force regeneration     |
| Locked out for 24h                | Legitimate travel detected    | Wait 24h or whitelist in code                 |

---

## Production Deployment Checklist

- [ ] IP2Proxy API key set in production environment
- [ ] HTTPS enabled (required for fingerprinting)
- [ ] Geolocation database updated
- [ ] Error messages reviewed and localized
- [ ] Monitoring/logging in place
- [ ] Backup plan if API fails
- [ ] User support team trained on bypass requests
- [ ] Legal review of blocking policy

---

## Support Resources

**IP2Proxy**:

- Docs: https://www.ip2proxy.com/developer
- API Status: https://www.ip2proxy.com/status

**Fingerprint2**:

- GitHub: https://github.com/fingerprintjs/fingerprintjs2
- Docs: https://github.com/fingerprintjs/fingerprintjs2#installation

**Firebase**:

- Auth Docs: https://firebase.google.com/docs/auth

---

**Last Updated**: 2024  
**Status**: ✅ Production Ready
