# 🔐 Authentication Setup Guide

Complete guide for configuring Google and Microsoft OAuth authentication for web and mobile apps.

---

## Table of Contents

- [Google OAuth Setup](#google-oauth-setup)
  - [OAuth Consent Screen](#1-oauth-consent-screen)
  - [Web Client Configuration](#2-oauth-20-client-id-web-application)
  - [Test Users](#3-add-test-users)
  - [Backend Configuration](#backend-configuration)
  - [Troubleshooting](#troubleshooting-google)
- [Microsoft OAuth Setup](#microsoft-oauth-setup)
  - [App Registration](#step-1-create-app-registration)
  - [Authentication Configuration](#step-2-configure-authentication)
  - [API Permissions](#step-3-configure-api-permissions)
  - [Backend Configuration](#step-4-configure-backend)
  - [Web App Configuration](#step-5-configure-web-app)
  - [Mobile App Configuration](#step-6-configure-mobile-app)
  - [Testing](#step-7-testing)
  - [Troubleshooting](#troubleshooting-microsoft)
- [Security Best Practices](#security-best-practices)

---

## Google OAuth Setup

### Issue: "Access blocked: Authorization Error"

This error occurs when Google Cloud Console OAuth settings are not properly configured for Expo Go.

### 1. OAuth Consent Screen

**URL:** https://console.cloud.google.com/apis/credentials/consent

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

**URL:** https://console.cloud.google.com/apis/credentials

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

### 3. Add Test Users

While your OAuth app is in "Testing" status, only approved test users can sign in.

**To add test users:**
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Scroll to "Test users"
3. Click "ADD USERS"
4. Enter your Gmail address (the one you're using to test)
5. Save

### Steps to Fix Authorization Errors

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

### Alternative: Publish the App (For Production)

If you want anyone to be able to sign in:
1. Go to OAuth Consent Screen
2. Click "PUBLISH APP"
3. Note: Google may require verification if requesting sensitive scopes

### Testing After Configuration

After making these changes:
1. Close the Expo Go app completely
2. Reopen it
3. Try logging in again
4. You should now be able to sign in with your Google account

### Backend Configuration

Your backend needs the Web Client ID configured in Azure App Configuration:
- Key: `Google:ClientId`
- Value: `765765451806-8552it3usqnh6qa7n457r32mcfv8g9u8.apps.googleusercontent.com`

### Troubleshooting Google

**Issue: "redirect_uri_mismatch"**
- Verify the redirect URI in Google Cloud Console exactly matches your Expo slug
- Check for typos, extra spaces, or incorrect capitalization

**Issue: "Access blocked: This app isn't verified"**
- Add your test Gmail address to the test users list
- Or publish the app (requires Google verification for sensitive scopes)

**Issue: "Invalid client ID"**
- Verify you're using the correct Web Client ID (not iOS or Android client ID)
- Check that the client ID is properly configured in your backend

---

## Microsoft OAuth Setup

Complete guide for setting up Microsoft login (via Microsoft Entra ID) for both web and mobile apps.

### Prerequisites

- An Azure account with access to Microsoft Entra ID (formerly Azure Active Directory)
- Access to the Azure Portal ([portal.azure.com](https://portal.azure.com))

### Step 1: Create App Registration

#### 1.1 Navigate to Microsoft Entra ID

1. Sign in to the [Azure Portal](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** (formerly Azure Active Directory)
3. Click on **App registrations** in the left sidebar
4. Click **+ New registration**

#### 1.2 Register Your Application

**Basic Settings:**
- **Name**: `Mental Health Journal` (or your preferred app name)
- **Supported account types**: Select one of the following:
  - **Accounts in any organizational directory and personal Microsoft accounts** (Recommended for multi-tenant)
  - **Accounts in this organizational directory only** (Single tenant)
- **Redirect URI**: 
  - Platform: **Single-page application (SPA)**
  - URI: `http://localhost:5173` (for local development)
  
Click **Register**

#### 1.3 Note Important IDs

After registration, you'll see the **Overview** page. Note these values:

- **Application (client) ID**: This is your `MICROSOFT_CLIENT_ID`
- **Directory (tenant) ID**: This is your `MICROSOFT_TENANT_ID` (or use "common" for multi-tenant)

### Step 2: Configure Authentication

#### 2.1 Add Redirect URIs

1. In your app registration, click **Authentication** in the left sidebar
2. Under **Single-page application**, add these redirect URIs:
   - `http://localhost:5173` (local development)
   - `https://your-production-domain.com` (production web app)

#### 2.2 Configure Platform Settings

**For Web App:**
- Platform is already set as **Single-page application (SPA)**
- Enable **ID tokens** under **Implicit grant and hybrid flows** (if needed)

**For Mobile App:**
1. Click **+ Add a platform**
2. Select **Mobile and desktop applications**
3. Add custom redirect URI: `msauth.com.mentalhealthjournal://auth`
4. Click **Configure**

#### 2.3 Enable Token Configuration

Under **Token configuration**:
- Optional claims are already included by default (email, profile, etc.)
- You can add additional optional claims if needed

### Step 3: Configure API Permissions

1. Click **API permissions** in the left sidebar
2. You should see **Microsoft Graph** with `User.Read` permission already added
3. Verify these permissions are present:
   - **Microsoft Graph**
     - `openid` (Sign users in)
     - `profile` (View users' basic profile)
     - `email` (View users' email address)

These are delegated permissions and do not require admin consent for personal Microsoft accounts.

### Step 4: Configure Backend

#### 4.1 Update appsettings.json

Add Microsoft configuration to your `appsettings.json` or Azure App Configuration:

```json
{
  "Microsoft": {
    "TenantId": "common",
    "ClientId": "YOUR_APPLICATION_CLIENT_ID_HERE"
  }
}
```

**Notes:**
- Use `"common"` for multi-tenant (personal + work/school accounts)
- Use `"organizations"` for work/school accounts only
- Use `"consumers"` for personal Microsoft accounts only
- Use your specific tenant ID for single-tenant apps

#### 4.2 Verify Configuration

The backend code is already set up to handle Microsoft authentication. Ensure these settings are correct:

- `Microsoft:TenantId` - Use "common" or your tenant ID
- `Microsoft:ClientId` - Your Application (client) ID from Step 1.3

### Step 5: Configure Web App

#### 5.1 Update Environment Variables

Create or update `.env` file in `mentalhealthjournal.client`:

```env
VITE_MICROSOFT_CLIENT_ID=YOUR_APPLICATION_CLIENT_ID_HERE
VITE_MICROSOFT_TENANT_ID=common
```

#### 5.2 Install Dependencies

The web app requires the MSAL browser library:

```bash
cd mentalhealthjournal.client
npm install @azure/msal-browser
```

### Step 6: Configure Mobile App

#### 6.1 Update Constants

Edit `MentalHealthJournal.Mobile/src/utils/constants.ts`:

```typescript
export const MICROSOFT_CLIENT_ID = 'YOUR_APPLICATION_CLIENT_ID_HERE';
export const MICROSOFT_TENANT_ID = 'common';
```

#### 6.2 Install Dependencies

The mobile app requires react-native-app-auth:

```bash
cd MentalHealthJournal.Mobile
npm install react-native-app-auth
```

#### 6.3 Configure iOS (if building for iOS)

1. Open `ios/MentalHealthJournal.xcworkspace` in Xcode
2. Add a URL scheme:
   - Select your project in the navigator
   - Select your app target
   - Go to **Info** tab
   - Expand **URL Types**
   - Click **+** to add a new URL type
   - **Identifier**: `com.microsoft.msauth`
   - **URL Schemes**: `msauth.com.mentalhealthjournal`

3. Update `ios/MentalHealthJournal/AppDelegate.m` (or `.mm` for newer projects):

```objc
#import <React/RCTLinkingManager.h>

// Add this method
- (BOOL)application:(UIApplication *)application
   openURL:(NSURL *)url
   options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}
```

#### 6.4 Configure Android (if building for Android)

1. Edit `android/app/src/main/AndroidManifest.xml`
2. Add the following inside the `<application>` tag:

```xml
<activity
    android:name="net.openid.appauth.RedirectUriReceiverActivity"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="msauth.com.mentalhealthjournal"/>
    </intent-filter>
</activity>
```

### Step 7: Testing

#### 7.1 Test Web App

1. Start the web app: `npm run dev` (in `mentalhealthjournal.client`)
2. Click "Sign in with Microsoft"
3. You should be redirected to Microsoft login
4. After successful login, you'll be redirected back to the app

#### 7.2 Test Mobile App

1. Start the mobile app: `npm start` (in `MentalHealthJournal.Mobile`)
2. Test on a device or simulator
3. Click "Sign in with Microsoft"
4. You should see the Microsoft login flow
5. After successful login, you'll be authenticated

### Troubleshooting Microsoft

**Issue: "AADSTS50011: The redirect URI specified in the request does not match"**
- **Solution**: Ensure the redirect URI in your app registration matches exactly what your app is using
- For web: Check `.env` file and Azure portal redirect URIs
- For mobile: Verify the custom URL scheme is configured correctly

**Issue: "Invalid client ID"**
- **Solution**: Verify `MICROSOFT_CLIENT_ID` matches the Application (client) ID from Azure portal

**Issue: "Token validation failed"**
- **Solution**: Ensure backend `Microsoft:ClientId` matches the Application (client) ID
- Verify `Microsoft:TenantId` is set correctly ("common", "organizations", "consumers", or your tenant ID)

**Issue: Mobile app doesn't open after Microsoft login**
- **Solution**: 
  - iOS: Verify URL scheme is configured in Xcode
  - Android: Verify redirect URI intent filter in AndroidManifest.xml
  - Ensure the redirect URI matches: `msauth.com.mentalhealthjournal://auth`

#### Debugging Tips

1. **Enable logging** in your app to see OAuth flow details
2. **Check Azure AD sign-in logs** in Azure Portal → Microsoft Entra ID → Sign-in logs
3. **Verify token** at [jwt.ms](https://jwt.ms) - paste the ID token to see claims
4. **Test with different account types** (personal, work/school) to ensure multi-tenant works

---

## Security Best Practices

### General OAuth Security

1. **Never commit secrets** - Use environment variables and Azure Key Vault
2. **Use HTTPS in production** - All redirect URIs must use HTTPS (except localhost)
3. **Validate tokens on backend** - Always verify token signature, issuer, and audience
4. **Keep dependencies updated** - Regularly update OAuth libraries
5. **Monitor sign-in logs** - Use provider logs to detect suspicious activity

### Google-Specific Security

1. **Limit scopes** - Only request the minimum required scopes
2. **Use test users** - Keep app in testing mode during development
3. **Verify domain ownership** - Required for publishing
4. **Enable 2FA** - For Google Cloud Console access

### Microsoft-Specific Security

1. **Use Conditional Access** - Configure MFA and other security policies in Azure AD
2. **Enable token validation** - Verify issuer, audience, and signature
3. **Monitor sign-in logs** - Use Azure AD sign-in logs for audit trails
4. **Use least privilege** - Only grant necessary API permissions

### Mobile Security

1. **Secure storage** - Store tokens in secure storage (Keychain/Keystore)
2. **Certificate pinning** - Consider pinning for production apps
3. **Deep link validation** - Verify redirect URIs are legitimate
4. **Biometric authentication** - Add biometric unlock for sensitive operations

---

## Additional Resources

### Google OAuth
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google OAuth Playground](https://developers.google.com/oauthplayground/)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)

### Microsoft OAuth
- [Microsoft Identity Platform Documentation](https://learn.microsoft.com/entra/identity-platform/)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [react-native-app-auth Documentation](https://github.com/FormidableLabs/react-native-app-auth)
- [Azure AD Token Reference](https://learn.microsoft.com/entra/identity-platform/id-tokens)

---

**Authentication configured! 🔐**  
Users can now sign in with Google or Microsoft accounts.
