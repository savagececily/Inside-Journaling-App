# Microsoft Login Setup Guide

This guide walks you through setting up Microsoft login (via Microsoft Entra ID) for both the web app and mobile app.

## Prerequisites

- An Azure account with access to Microsoft Entra ID (formerly Azure Active Directory)
- Access to the Azure Portal ([portal.azure.com](https://portal.azure.com))

## Step 1: Create App Registration

### 1.1 Navigate to Microsoft Entra ID

1. Sign in to the [Azure Portal](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** (formerly Azure Active Directory)
3. Click on **App registrations** in the left sidebar
4. Click **+ New registration**

### 1.2 Register Your Application

**Basic Settings:**
- **Name**: `Mental Health Journal` (or your preferred app name)
- **Supported account types**: Select one of the following:
  - **Accounts in any organizational directory and personal Microsoft accounts** (Recommended for multi-tenant)
  - **Accounts in this organizational directory only** (Single tenant)
- **Redirect URI**: 
  - Platform: **Single-page application (SPA)**
  - URI: `http://localhost:5173` (for local development)
  
Click **Register**

### 1.3 Note Important IDs

After registration, you'll see the **Overview** page. Note these values:

- **Application (client) ID**: This is your `MICROSOFT_CLIENT_ID`
- **Directory (tenant) ID**: This is your `MICROSOFT_TENANT_ID` (or use "common" for multi-tenant)

## Step 2: Configure Authentication

### 2.1 Add Redirect URIs

1. In your app registration, click **Authentication** in the left sidebar
2. Under **Single-page application**, add these redirect URIs:
   - `http://localhost:5173` (local development)
   - `https://your-production-domain.com` (production web app)

### 2.2 Configure Platform Settings

**For Web App:**
- Platform is already set as **Single-page application (SPA)**
- Enable **ID tokens** under **Implicit grant and hybrid flows** (if needed)

**For Mobile App:**
1. Click **+ Add a platform**
2. Select **Mobile and desktop applications**
3. Add custom redirect URI: `msauth.com.mentalhealthjournal://auth`
4. Click **Configure**

### 2.3 Enable Token Configuration

Under **Token configuration**:
- Optional claims are already included by default (email, profile, etc.)
- You can add additional optional claims if needed

## Step 3: Configure API Permissions

1. Click **API permissions** in the left sidebar
2. You should see **Microsoft Graph** with `User.Read` permission already added
3. Verify these permissions are present:
   - **Microsoft Graph**
     - `openid` (Sign users in)
     - `profile` (View users' basic profile)
     - `email` (View users' email address)

These are delegated permissions and do not require admin consent for personal Microsoft accounts.

## Step 4: Configure Backend

### 4.1 Update appsettings.json

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

### 4.2 Verify Configuration

The backend code is already set up to handle Microsoft authentication. Ensure these settings are correct:

- `Microsoft:TenantId` - Use "common" or your tenant ID
- `Microsoft:ClientId` - Your Application (client) ID from Step 1.3

## Step 5: Configure Web App

### 5.1 Update Environment Variables

Create or update `.env` file in `mentalhealthjournal.client`:

```env
VITE_MICROSOFT_CLIENT_ID=YOUR_APPLICATION_CLIENT_ID_HERE
VITE_MICROSOFT_TENANT_ID=common
```

### 5.2 Install Dependencies

The web app requires the MSAL browser library:

```bash
cd mentalhealthjournal.client
npm install @azure/msal-browser
```

## Step 6: Configure Mobile App

### 6.1 Update Constants

Edit `MentalHealthJournal.Mobile/src/utils/constants.ts`:

```typescript
export const MICROSOFT_CLIENT_ID = 'YOUR_APPLICATION_CLIENT_ID_HERE';
export const MICROSOFT_TENANT_ID = 'common';
```

### 6.2 Install Dependencies

The mobile app requires react-native-app-auth:

```bash
cd MentalHealthJournal.Mobile
npm install react-native-app-auth
```

### 6.3 Configure iOS (if building for iOS)

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

### 6.4 Configure Android (if building for Android)

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

## Step 7: Testing

### 7.1 Test Web App

1. Start the web app: `npm run dev` (in `mentalhealthjournal.client`)
2. Click "Sign in with Microsoft"
3. You should be redirected to Microsoft login
4. After successful login, you'll be redirected back to the app

### 7.2 Test Mobile App

1. Start the mobile app: `npm start` (in `MentalHealthJournal.Mobile`)
2. Test on a device or simulator
3. Click "Sign in with Microsoft"
4. You should see the Microsoft login flow
5. After successful login, you'll be authenticated

## Troubleshooting

### Common Issues

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

### Debugging Tips

1. **Enable logging** in your app to see OAuth flow details
2. **Check Azure AD sign-in logs** in Azure Portal → Microsoft Entra ID → Sign-in logs
3. **Verify token** at [jwt.ms](https://jwt.ms) - paste the ID token to see claims
4. **Test with different account types** (personal, work/school) to ensure multi-tenant works

## Security Best Practices

1. **Never commit secrets** - Use environment variables and Azure Key Vault
2. **Use HTTPS in production** - All redirect URIs must use HTTPS (except localhost)
3. **Validate tokens on backend** - Always verify token signature, issuer, and audience
4. **Keep dependencies updated** - Regularly update MSAL libraries
5. **Monitor sign-in logs** - Use Azure AD sign-in logs to detect suspicious activity
6. **Use Conditional Access** - Configure MFA and other security policies in Azure AD

## Additional Resources

- [Microsoft Identity Platform Documentation](https://learn.microsoft.com/entra/identity-platform/)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [react-native-app-auth Documentation](https://github.com/FormidableLabs/react-native-app-auth)
- [Azure AD Token Reference](https://learn.microsoft.com/entra/identity-platform/id-tokens)

## Next Steps

After setting up Microsoft login:

1. Test with different account types (personal, work/school)
2. Configure Conditional Access policies if needed
3. Set up monitoring and alerts for authentication events
4. Consider adding sign-out functionality
5. Implement token refresh if needed for long-running sessions
