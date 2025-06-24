export interface UserHousehold {
  householdId: string;
  role: 'head' | 'member';
  joinedAt: Date;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  households: UserHousehold[];
  currentHouseholdId?: string;
  gems: number;
  createdAt: Date;
}

export interface Household {
  id: string;
  name: string;
  headOfHousehold: string;
  members: string[];
  inviteLinks: InviteLink[];
  gemPrompt?: string;
  allowGemOverride?: boolean;
  createdAt: Date;
}

export interface InviteLink {
  memberId: string;
  token: string;
  expiresAt?: Date;
}

export interface InviteToken {
  id: string; // This will be the token itself
  householdId: string;
  createdBy: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ChecklistGroup {
  id: string;
  items: ChecklistItem[];
  contextBefore?: string;
}

export interface Task {
  id: string;
  householdId: string;
  creatorId: string;
  title: string;
  description: string;
  status: TaskStatus;
  claimedBy?: string;
  dueDate: Date;
  gems: number;
  recurrence?: RecurrenceConfig;
  verifications: Verification[];
  checklistGroups?: ChecklistGroup[];
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = 'draft' | 'published' | 'claimed' | 'completed' | 'verified';

export interface Verification {
  userId: string;
  verified: boolean;
  verifiedAt: Date;
}

export interface RecurrenceConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  daysOfWeek?: number[];
  endDate?: Date;
}

export interface GemTransaction {
  id: string;
  userId: string;
  taskId?: string;
  amount: number;
  type: 'task_creation' | 'task_completion' | 'verification' | 'bonus';
  description: string;
  createdAt: Date;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  taskReminders: boolean;
  verificationRequests: boolean;
}