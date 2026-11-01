export type RiskTier = 'low' | 'medium' | 'high' | 'prohibited'

export type PermissionScope =
  | 'calendar.read'
  | 'calendar.write'
  | 'email.read'
  | 'email.draft'
  | 'contacts.read'
  | 'files.read'
  | 'files.write'
  | 'notes.read'
  | 'notes.write'
  | 'browser.tasks'
  | 'reminders.manage'
  | 'weather.location'
  | 'spotify.music'
  | 'smarthome.control'
  | 'github.read'
  | 'github.pr_draft'
  | 'computer_helper.sandbox'

export interface ScopeDefinition {
  scope: PermissionScope
  label: string
  risk: RiskTier
  granted: boolean
  expiresAt?: number // timestamp, null for persistent until revoked
}

export interface IntegrationDefinition {
  id: string
  name: string
  icon: string
  category: 'productivity' | 'communication' | 'media' | 'developer' | 'system'
  description: string
  enabled: boolean
  scopes: ScopeDefinition[]
  authType: 'oauth' | 'token' | 'local_sandbox'
  connectedAccount?: string
  lastUsed?: number
}

export interface AuditLogEntry {
  id: string
  timestamp: number
  integrationId: string
  action: string
  scope: PermissionScope
  risk: RiskTier
  status: 'allowed' | 'confirmed' | 'blocked' | 'rejected' | 'paused'
  reason?: string
  channel: 'in_app' | 'voice' | 'whatsapp' | 'telegram'
  metadata?: Record<string, unknown>
}

export interface PermissionPolicyConfig {
  globalPauseAll: boolean
  requireConfirmationForMedium: boolean
  requireConfirmationForHigh: boolean
  autoRevokeInactiveDays: number
  blockUntrustedPromptInjections: boolean
}

export const PROHIBITED_CAPABILITIES = [
  'payments.send_money',
  'banking.access',
  'passwords.export',
  'files.permanent_delete_without_trash',
  'email.auto_send_without_confirmation',
  'system.raw_sudo_execution',
] as const
