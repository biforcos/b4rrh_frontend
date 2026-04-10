export interface DevAuthRequest {
  subject: string;
  expiresInMinutes?: number;
}

export interface DevAuthResponse {
  tokenType: string;
  token: string;
  subject: string;
  expiresAt: string;
}

export interface AuthSessionState {
  token: string | null;
  subject: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}