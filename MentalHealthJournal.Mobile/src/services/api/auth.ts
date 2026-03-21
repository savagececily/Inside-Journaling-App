// Authentication API Service
import apiClient from './client';
import { User, AuthResponse } from '../../types/api';

export interface GoogleLoginRequest {
  idToken: string;
  dateOfBirth?: Date;
}

export interface RefreshUserResponse {
  user: User;
}

/**
 * Authenticate with Google ID token
 */
export async function googleLogin(request: GoogleLoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/google', {
    idToken: request.idToken,
    dateOfBirth: request.dateOfBirth,
  });
  
  return response.data;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
}

/**
 * Refresh user data from server
 */
export async function refreshUser(): Promise<User> {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
}

/**
 * Verify age (if required after initial login)
 */
export async function verifyAge(dateOfBirth: Date): Promise<User> {
  const response = await apiClient.post<User>('/auth/verify-age', {
    dateOfBirth,
  });
  return response.data;
}
