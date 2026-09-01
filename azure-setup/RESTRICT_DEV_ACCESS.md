# Restrict Development Slot Access to Admins

## Overview

Secure the development slot so only authorized admins can access it using Azure App Service Authentication (Easy Auth).

---

## Quick Setup (5 minutes)

### Option 1: Use Existing Azure AD App (Fastest)

The development slot already has an Azure AD app registration configured. Just enable authentication requirement:

```bash
# 1. Enable authentication and require login
az webapp auth update \
  --name inside-journaling-app \
  --resource-group InsideJournalingAppRG \
  --slot development \
  --enabled true \
  --action RedirectToLoginPage \
  --aad-client-id "2bdef97c-c4a9-43ed-9947-944b43cf8e97"

# 2. Verify configuration
az webapp auth show \
  --name inside-journaling-app \
  --resource-group InsideJournalingAppRG \
  --slot development
```

### Option 2: Azure Portal (Visual)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to: **inside-journaling-app** **Deployment slots** **development**
3. In left menu, click **Authentication**
4. Click **Add identity provider**
5. Choose **Microsoft**
6. Set:
   - **Client ID**: Use existing app registration
   - **Tenant type**: Workforce (current tenant)
 - **Restrict access**: **Require authentication**
   - **Unauthenticated requests**: **HTTP 401 Unauthorized (recommended for APIs)** or **HTTP 302 redirect** for web
7. Click **Add**

---

## Restrict to Specific Admins

After enabling authentication, restrict to specific users:

### In Azure Portal:

1. Go to **Microsoft Entra ID** **Enterprise Applications**
2. Search for your app registration (e.g., "inside-journaling-app-dev")
3. Go to **Properties**
4. Set **Assignment required?** to **Yes**
5. Click **Save**
6. Go to **Users and groups**
7. Click **Add user/group**
8. Select specific admin users/groups who should have access
9. Click **Assign**

### Result:

 Only assigned users can access the development slot
 Unauthenticated users get 401 or redirected to login
 Non-admin users see "You don't have permission to access this application"

---

## Verify It Works

Test the configuration:

```bash
# Open development site in incognito/private window
open https://inside-journaling-app-development.azurewebsites.net

# You should be prompted to login
# After login, only whitelisted admins will be granted access
```

---

## Production vs Development

**Production slot:** Keep existing authentication (allows all Google users)  
**Development slot:** Restrict to internal admins only (Microsoft Entra ID)

This gives you:
- Public production site for all users
- Private development site for testing and validation

---

## Quick Reference

**Development slot URL:** https://inside-journaling-app-development.azurewebsites.net  
**Production slot URL:** https://inside-journaling-app.azurewebsites.net

**Current Azure AD app:** `2bdef97c-c4a9-43ed-9947-944b43cf8e97`  
**Tenant:** Common (Microsoft accounts + Entra ID)

---

## Remove Restrictions (if needed)

To allow anonymous access again:

```bash
az webapp auth update \
  --name inside-journaling-app \
  --resource-group InsideJournalingAppRG \
  --slot development \
  --enabled true \
  --action AllowAnonymous
```

---

## Alternative: IP Restrictions

If you want to restrict by IP address instead of user authentication:

```bash
# Allow only your IP address
az webapp config access-restriction add \
  --name inside-journaling-app \
  --resource-group InsideJournalingAppRG \
  --slot development \
  --rule-name "Admin-IP" \
  --action Allow \
  --ip-address "YOUR_IP_ADDRESS/32" \
  --priority 100

# Block all other IPs
az webapp config access-restriction add \
  --name inside-journaling-app \
  --resource-group InsideJournalingAppRG \
  --slot development \
  --rule-name "Deny-All" \
  --action Deny \
  --ip-address "0.0.0.0/0" \
  --priority 200
```

Get your IP: https://whatismyipaddress.com
