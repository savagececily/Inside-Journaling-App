# Google OAuth Setup for Expo Go

## Issue: "Access blocked: Authorization Error - doesn't comply with Google's OAuth 2.0 policy"

This error occurs when Google Cloud Console OAuth settings are not properly configured for Expo Go.

## Required Configuration

### 1. OAuth Consent Screen
Go to: https://console.cloud.google.com/apis/credentials/consent

**Settings:**
- **User Type**: Choose "External" (unless you have a Google Workspace)
- **Publishing Status**: 
  - For development/testing: Keep in "Testing" mode
  - Add your Google account as a **Test User**
- **Scopes**: Add the following OAuth scopes:
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
  - `openid`

### 2. OAuth 2.0 Client ID (Web Application)
Go to: https://console.cloud.google.com/apis/credentials

Find your Web Client ID: `765765451806-8552it3usqnh6qa7n457r32mcfv8g9u8.apps.googleusercontent.com`

**Authorized JavaScript Origins:**
```
https://auth.expo.io
```

**Authorized Redirect URIs:**
```
https://auth.expo.io/@savagececily/mental-health-journal
```

⚠️ **Critical**: The redirect URI must EXACTLY match your Expo slug:
- Current slug from app.json: `@savagececily/mental-health-journal`
- Required redirect URI: `https://auth.expo.io/@savagececily/mental-health-journal`

### 3. Add Test Users (If app is in Testing mode)

While your OAuth app is in "Testing" status, only approved test users can sign in.

**To add test users:**
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Scroll to "Test users"
3. Click "ADD USERS"
4. Enter your Gmail address (the one you're using to test)
5. Save

## Steps to Fix:

1. **Go to Google Cloud Console OAuth Consent Screen:**
   https://console.cloud.google.com/apis/credentials/consent

2. **Add yourself as a test user:**
   - Click "ADD USERS"
   - Add your Gmail address
   - Save

3. **Verify redirect URI in Web Client ID:**
   https://console.cloud.google.com/apis/credentials
   - Find your Web OAuth client
   - Ensure redirect URI is: `https://auth.expo.io/@savagececily/mental-health-journal`
   - Make sure there are NO extra spaces or typos

4. **Save all changes and wait 5-10 minutes** for Google to propagate the changes

5. **Try logging in again**

## Alternative: Publish the App (For Production)

If you want anyone to be able to sign in:
1. Go to OAuth Consent Screen
2. Click "PUBLISH APP"
3. Note: Google may require verification if requesting sensitive scopes

## Testing After Configuration

After making these changes:
1. Close the Expo Go app completely
2. Reopen it
3. Try logging in again
4. You should now be able to sign in with your Google account

## Backend Configuration

Your backend also needs the same Web Client ID configured in Azure App Configuration:
- Key: `Google:ClientId`
- Value: `765765451806-8552it3usqnh6qa7n457r32mcfv8g9u8.apps.googleusercontent.com`

✅ You mentioned this is already configured, so no action needed here.
