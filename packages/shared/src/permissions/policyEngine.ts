import {
  AuditLogEntry,
  IntegrationDefinition,
  PermissionPolicyConfig,
  PermissionScope,
  PROHIBITED_CAPABILITIES,
  RiskTier,
} from './types.js'

export const DEFAULT_INTEGRATIONS: IntegrationDefinition[] = [
  {
    id: 'calendar',
    name: 'Google Calendar',
    icon: 'Calendar',
    category: 'productivity',
    description: 'Read upcoming events and draft schedule appointments.',
    enabled: true,
    authType: 'oauth',
    scopes: [
      { scope: 'calendar.read', label: 'Read calendar events & schedule', risk: 'low', granted: true },
      { scope: 'calendar.write', label: 'Create & schedule appointments', risk: 'medium', granted: false },
    ],
  },
  {
    id: 'email',
    name: 'Email (Gmail / Outlook)',
    icon: 'Mail',
    category: 'communication',
    description: 'Review important message summaries and prepare drafts. Never auto-sends.',
    enabled: true,
    authType: 'oauth',
    scopes: [
      { scope: 'email.read', label: 'Read inbox headers and summaries', risk: 'low', granted: true },
      { scope: 'email.draft', label: 'Prepare draft replies (Never auto-send)', risk: 'medium', granted: false },
    ],
  },
  {
    id: 'contacts',
    name: 'Contacts',
    icon: 'Users',
    category: 'communication',
    description: 'Recall birthdays, preferred names, and contact details.',
    enabled: false,
    authType: 'oauth',
    scopes: [
      { scope: 'contacts.read', label: 'Read contact names & birthdays', risk: 'low', granted: false },
    ],
  },
  {
    id: 'files',
    name: 'Scoped Folder & Drive Files',
    icon: 'Folder',
    category: 'productivity',
    description: 'Read and organize documents within explicitly selected folders only.',
    enabled: false,
    authType: 'oauth',
    scopes: [
      { scope: 'files.read', label: 'Read scoped documents for RAG', risk: 'low', granted: false },
      { scope: 'files.write', label: 'Save exported notes & summaries', risk: 'medium', granted: false },
    ],
  },
  {
    id: 'notes',
    name: 'Personal Notes & Reminders',
    icon: 'FileText',
    category: 'productivity',
    description: 'Maintain to-do checklists, journal reflections, and study notes.',
    enabled: true,
    authType: 'token',
    scopes: [
      { scope: 'notes.read', label: 'Read personal notes', risk: 'low', granted: true },
      { scope: 'notes.write', label: 'Create & edit checklists', risk: 'low', granted: true },
      { scope: 'reminders.manage', label: 'Set timer alerts', risk: 'low', granted: true },
    ],
  },
  {
    id: 'browser',
    name: 'Sandboxed Browser Tasks',
    icon: 'Globe',
    category: 'productivity',
    description: 'Fetch web search results and summarize public documentation.',
    enabled: true,
    authType: 'token',
    scopes: [
      { scope: 'browser.tasks', label: 'Fetch public web pages & search', risk: 'low', granted: true },
    ],
  },
  {
    id: 'weather',
    name: 'Weather & Coarse City Location',
    icon: 'CloudSun',
    category: 'productivity',
    description: 'Provide accurate morning forecasts and outfit recommendations.',
    enabled: true,
    authType: 'token',
    scopes: [
      { scope: 'weather.location', label: 'Read coarse city weather', risk: 'low', granted: true },
    ],
  },
  {
    id: 'spotify',
    name: 'Spotify Music Control',
    icon: 'Music',
    category: 'media',
    description: 'Play focus playlists, synthwave study tracks, and mood anthems.',
    enabled: false,
    authType: 'oauth',
    scopes: [
      { scope: 'spotify.music', label: 'Control active music playback', risk: 'low', granted: false },
    ],
  },
  {
    id: 'smarthome',
    name: 'Smart Home (Lights & Ambient)',
    icon: 'Home',
    category: 'system',
    description: 'Sync room ambient lighting with Ada holographic theme.',
    enabled: false,
    authType: 'oauth',
    scopes: [
      { scope: 'smarthome.control', label: 'Adjust ambient lights & color', risk: 'medium', granted: false },
    ],
  },
  {
    id: 'github',
    name: 'GitHub Developer',
    icon: 'GitPullRequest',
    category: 'developer',
    description: 'Review issue backlogs and prepare draft pull requests.',
    enabled: false,
    authType: 'token',
    scopes: [
      { scope: 'github.read', label: 'Read repo issues & diffs', risk: 'low', granted: false },
      { scope: 'github.pr_draft', label: 'Open draft PR branch (Never merges)', risk: 'medium', granted: false },
    ],
  },
  {
    id: 'computer_helper',
    name: 'Local Computer Helper (Sandboxed)',
    icon: 'Terminal',
    category: 'system',
    description: 'Execute approved local terminal commands within isolated scratch folder.',
    enabled: false,
    authType: 'local_sandbox',
    scopes: [
      { scope: 'computer_helper.sandbox', label: 'Run sandboxed scratch commands', risk: 'high', granted: false },
    ],
  },
]

export class PermissionPolicyEngine {
  private config: PermissionPolicyConfig = {
    globalPauseAll: false,
    requireConfirmationForMedium: true,
    requireConfirmationForHigh: true,
    autoRevokeInactiveDays: 30,
    blockUntrustedPromptInjections: true,
  }

  private integrations: Map<string, IntegrationDefinition> = new Map()
  private auditLogs: AuditLogEntry[] = []

  constructor(initialIntegrations: IntegrationDefinition[] = DEFAULT_INTEGRATIONS) {
    initialIntegrations.forEach((i) => this.integrations.set(i.id, JSON.parse(JSON.stringify(i))))
  }

  getConfig(): PermissionPolicyConfig {
    return { ...this.config }
  }

  setGlobalPause(pause: boolean): void {
    this.config.globalPauseAll = pause
    this.logAction({
      id: `audit-${Date.now()}`,
      timestamp: Date.now(),
      integrationId: 'system',
      action: pause ? 'PAUSE_ALL_PERMISSIONS' : 'RESUME_ALL_PERMISSIONS',
      scope: 'notes.read',
      risk: 'high',
      status: pause ? 'paused' : 'allowed',
      reason: pause ? 'User engaged master privacy killswitch' : 'User resumed integrations',
      channel: 'in_app',
    })
  }

  getIntegrations(): IntegrationDefinition[] {
    return Array.from(this.integrations.values())
  }

  getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs]
  }

  setScopeGrant(integrationId: string, scope: PermissionScope, granted: boolean): boolean {
    const integration = this.integrations.get(integrationId)
    if (!integration) return false

    const targetScope = integration.scopes.find((s) => s.scope === scope)
    if (!targetScope) return false

    targetScope.granted = granted
    if (granted && !integration.enabled) {
      integration.enabled = true
    }

    this.logAction({
      id: `audit-${Date.now()}`,
      timestamp: Date.now(),
      integrationId,
      action: granted ? 'SCOPE_GRANTED' : 'SCOPE_REVOKED',
      scope,
      risk: targetScope.risk,
      status: 'allowed',
      reason: `User manually ${granted ? 'granted' : 'revoked'} scope in Permission Center`,
      channel: 'in_app',
    })

    return true
  }

  /**
   * Check whether an action is permitted before execution.
   */
  evaluateRequest(
    integrationId: string,
    scope: PermissionScope,
    action: string,
    channel: 'in_app' | 'voice' | 'whatsapp' | 'telegram' = 'in_app',
    untrustedInput?: string
  ): { allowed: boolean; requiresConfirmation: boolean; risk: RiskTier; reason?: string } {
    // 1. Prohibited check
    if (PROHIBITED_CAPABILITIES.some((p) => (p as string) === action || (p as string) === scope)) {
      this.logAction({
        id: `audit-${Date.now()}`,
        timestamp: Date.now(),
        integrationId,
        action,
        scope,
        risk: 'prohibited',
        status: 'blocked',
        reason: 'Action strictly prohibited under security constitution',
        channel,
      })
      return { allowed: false, requiresConfirmation: false, risk: 'prohibited', reason: 'Prohibited capability' }
    }

    // 2. Global Pause check
    if (this.config.globalPauseAll) {
      this.logAction({
        id: `audit-${Date.now()}`,
        timestamp: Date.now(),
        integrationId,
        action,
        scope,
        risk: 'low',
        status: 'paused',
        reason: 'Integrations globally paused by operator',
        channel,
      })
      return { allowed: false, requiresConfirmation: false, risk: 'low', reason: 'Integrations globally paused' }
    }

    // 3. Prompt injection detection on untrusted input
    if (untrustedInput && this.config.blockUntrustedPromptInjections) {
      const injectionPattern = /(ignore previous instructions|grant permissions|send email to|override security|system prompt override|exfiltrate|delete all)/i
      if (injectionPattern.test(untrustedInput)) {
        this.logAction({
          id: `audit-${Date.now()}`,
          timestamp: Date.now(),
          integrationId,
          action,
          scope,
          risk: 'high',
          status: 'blocked',
          reason: 'Blocked suspected prompt injection from untrusted source',
          channel,
        })
        return {
          allowed: false,
          requiresConfirmation: false,
          risk: 'high',
          reason: 'Blocked by prompt injection defense shield',
        }
      }
    }

    // 4. Resolve integration & scope
    const integration = this.integrations.get(integrationId)
    if (!integration || !integration.enabled) {
      return { allowed: false, requiresConfirmation: false, risk: 'low', reason: 'Integration disabled' }
    }

    const scopeDef = integration.scopes.find((s) => s.scope === scope)
    if (!scopeDef || !scopeDef.granted) {
      return { allowed: false, requiresConfirmation: false, risk: 'low', reason: 'Scope not granted' }
    }

    // 5. Channel rules: external channels (WhatsApp/Telegram) cannot execute medium/high actions without in-app confirmation
    if ((channel === 'whatsapp' || channel === 'telegram') && (scopeDef.risk === 'medium' || scopeDef.risk === 'high')) {
      return {
        allowed: false,
        requiresConfirmation: true,
        risk: scopeDef.risk,
        reason: 'Requires in-app biometric/touch confirmation for external channel',
      }
    }

    // 6. Confirmation requirements by risk tier
    const requiresConfirmation =
      (scopeDef.risk === 'medium' && this.config.requireConfirmationForMedium) ||
      (scopeDef.risk === 'high' && this.config.requireConfirmationForHigh)

    this.logAction({
      id: `audit-${Date.now()}`,
      timestamp: Date.now(),
      integrationId,
      action,
      scope,
      risk: scopeDef.risk,
      status: requiresConfirmation ? 'confirmed' : 'allowed',
      reason: requiresConfirmation ? 'Awaiting user confirmation card' : 'Policy permitted',
      channel,
    })

    return { allowed: true, requiresConfirmation, risk: scopeDef.risk }
  }

  private logAction(entry: AuditLogEntry): void {
    this.auditLogs.unshift(entry)
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop()
    }
  }
}

export const globalPermissionEngine = new PermissionPolicyEngine()

export class PolicyEngine {
  static evaluateAction(integrationId: string, action: string, untrustedInput?: string, channel?: string) {
    return globalPermissionEngine.evaluateRequest(
      integrationId,
      `${integrationId}.read` as any,
      action,
      (channel as any) || 'in_app',
      untrustedInput
    )
  }

  static setAllPaused(paused: boolean): void {
    globalPermissionEngine.setGlobalPause(paused)
  }

  static isAllPaused(): boolean {
    return globalPermissionEngine.getConfig().globalPauseAll
  }

  static getAuditLog() {
    return globalPermissionEngine.getAuditLogs()
  }
}
