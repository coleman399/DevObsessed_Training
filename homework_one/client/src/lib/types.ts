export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface MeResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Stats {
  drafts: number;
  pendingInvites: number;
  workspaceName: string;
  memberCount: number;
  plan: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `Request failed (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}
