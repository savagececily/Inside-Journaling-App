import { PublicClientApplication, type AuthenticationResult } from '@azure/msal-browser';

const msalConfig = {
    auth: {
        clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
        authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MICROSOFT_TENANT_ID || 'common'}`,
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: false,
    }
};

const loginRequest = {
    scopes: ['openid', 'profile', 'email']
};

let msalInstance: PublicClientApplication | null = null;

async function getMsalInstance(): Promise<PublicClientApplication> {
    if (!msalInstance) {
        msalInstance = new PublicClientApplication(msalConfig);
        await msalInstance.initialize();
    }
    return msalInstance;
}

export async function loginWithMicrosoft(): Promise<string> {
    const msal = await getMsalInstance();
    
    try {
        const response: AuthenticationResult = await msal.loginPopup(loginRequest);
        return response.idToken;
    } catch (error) {
        console.error('Microsoft login error:', error);
        throw error;
    }
}

export async function logoutMicrosoft(): Promise<void> {
    const msal = await getMsalInstance();
    await msal.logoutPopup();
}
