export type UserRole = 'ProductOwner' | 'SoftwareEngineer' | 'QA';

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  onboardingComplete: boolean;
  devOpsOrganization: string | null;
  devOpsProject: string | null;
  gitHubOrganization: string | null;
  hasAnthropicKey: boolean;
  hasGitHubPat: boolean;
  teamsChannelsJson: string | null;
  model: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserProfile;
}

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

export interface ConversationDetail {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface UpdateProfileRequest {
  role?: UserRole;
  anthropicApiKey?: string;
  devOpsOrganization?: string;
  devOpsProject?: string;
  gitHubOrganization?: string;
  gitHubPat?: string;
  teamsChannelsJson?: string;
}

// ── Work Items ───────────────────────────────────────────────────────────────

export type WorkItemType = 'Bug' | 'Task' | 'User Story';

export interface WorkItemSummary {
  id: number;
  title: string;
  state: string;
  workItemType: WorkItemType;
  url: string | null;
}

export interface WorkItemDraft {
  workItemType: WorkItemType;
  title: string;
  description: string;
  reproSteps?: string;
  remainingWork?: number;
  acceptanceCriteria?: string[];
  tags: string[];
}

// ── Mail ─────────────────────────────────────────────────────────────────────

export interface MailMessage {
  id: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  receivedAt: string;
  bodyPreview: string;
  isRead: boolean;
}

export interface MailMessageDetail extends MailMessage {
  body: string;
}

export interface EmailDraft {
  subject: string;
  body: string;
}

// ── Calendar ─────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  isAllDay: boolean;
  joinUrl: string | null;
  location: string | null;
  attendees: string[] | null;
}

export interface EventDraft {
  title: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  description: string;
}

// ── Teams ─────────────────────────────────────────────────────────────────────

export interface TeamsChat {
  id: string;
  topic: string;
  lastMessagePreview: string;
  lastMessageAt: string;
}

export interface ChannelMessage {
  id: string;
  sender: string;
  sentAt: string;
  content: string;
}

export interface TeamsChannel {
  teamId: string;
  teamName: string;
  channelId: string;
  channelName: string;
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
