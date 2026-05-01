// Authentication API Service
import apiClient from './client';
import { User, AuthResponse } from '../../types/api';

export interface GoogleLoginRequest {
  idToken: string;
  dateOfBirth?: Date;
}

export interface MicrosoftLoginRequest {
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
  // Build request body - only include DateOfBirth if provided
  const body: any = {
    IdToken: request.idToken,
  };
  
  if (request.dateOfBirth) {
    body.DateOfBirth = request.dateOfBirth;
  }
  
  const response = await apiClient.post<AuthResponse>('/auth/google', body);
  
  return response.data;
}

/**
 * Authenticate with Microsoft ID token
 */
export async function microsoftLogin(request: MicrosoftLoginRequest): Promise<AuthResponse> {
  // Build request body - only include DateOfBirth if provided
  const body: any = {
    IdToken: request.idToken,
  };
  
  if (request.dateOfBirth) {
    body.DateOfBirth = request.dateOfBirth;
  }
  
  const response = await apiClient.post<AuthResponse>('/auth/microsoft', body);
  
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
    DateOfBirth: dateOfBirth,
  });
  return response.data;
}
