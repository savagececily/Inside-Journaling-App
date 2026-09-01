export interface User {
    id: string;
    email: string;
    name: string;
    username?: string;
    profilePictureUrl?: string;
    provider: string;
    providerId: string;
    dateOfBirth?: string;
    ageVerified: boolean;
}

export interface AuthResponse {
    token: string;
    user: User;
    requiresAgeVerification: boolean;
}
