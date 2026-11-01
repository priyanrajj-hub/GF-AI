import React, { useState } from 'react'
import {
  X,
  Shield,
  ShieldAlert,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
  Calendar,
  Mail,
  Users,
  Folder,
  FileText,
  Globe,
  CloudSun,
  Music,
  Home,
  GitPullRequest,
  Terminal,
  Check,
  AlertTriangle,
  Download,
  Search,
} from 'lucide-react'
import {
  globalPermissionEngine,
  IntegrationDefinition,
  PermissionScope,
  RiskTier,
} from '@ada/shared'
import { useAppStore } from '../../store/useAppStore.js'

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Calendar,
  Mail,
  Users,
  Folder,
  FileText,
  Globe,
  CloudSun,
  Music,
  Home,
  GitPullRequest,
  Terminal,
}

export const PermissionCenterModal: React.FC = () => {
  const { showPermissionCenter, setShowPermissionCenter } = useAppStore()

  const [activeTab, setActiveTab] = useState<'integrations' | 'audit'>('integrations')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isPaused, setIsPaused] = useState<boolean>(globalPermissionEngine.getConfig().globalPauseAll)
  const [, setRerender] = useState(0)

  if (!showPermissionCenter) return null

  const integrations = globalPermissionEngine.getIntegrations()
  const auditLogs = globalPermissionEngine.getAuditLogs()

  const handleToggleScope = (integrationId: string, scope: PermissionScope, currentVal: boolean) => {
    globalPermissionEngine.setScopeGrant(integrationId, scope, !currentVal)
    setRerender((v) => v + 1)
  }

  const handleToggleGlobalPause = () => {
    const next = !isPaused
    globalPermissionEngine.setGlobalPause(next)
    setIsPaused(next)
    setRerender((v) => v + 1)
  }

  const handleExportAudit = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `ada-permission-audit-${Date.now()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const filteredIntegrations = integrations.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  const getRiskBadge = (risk: RiskTier) => {
    switch (risk) {
      case 'low':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">Low Risk</span>
      case 'medium':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">Confirmation Required</span>
      case 'high':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">High Risk (Prompt Check)</span>
      case 'prohibited':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-700 font-mono">Prohibited</span>
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-5xl h-[90vh] glass-panel rounded-3xl border border-cyan-500/30 overflow-hidden flex flex-col shadow-2xl bg-slate-950/95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-500/20 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${isPaused ? 'bg-amber-500/20 border-amber-400/40 text-amber-300' : 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
                <span>ADA PERMISSION & ACCESS CENTER</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                  LEAST PRIVILEGE ACTIVE
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Granular Scopes, Risk Tiers, Prompt Injection Shield & Audit Logging
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Global Pause Switch */}
            <button
              onClick={handleToggleGlobalPause}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isPaused
                  ? 'bg-amber-500/30 text-amber-200 border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'bg-slate-900/60 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              {isPaused ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'RESUME INTEGRATIONS' : 'PAUSE ALL ACCESS'}</span>
            </button>

            <button
              onClick={() => setShowPermissionCenter(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Pause Alert Banner */}
        {isPaused && (
          <div className="px-6 py-2.5 bg-amber-500/20 border-b border-amber-400/30 flex items-center gap-2 text-xs font-mono text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              MASTER PRIVACY KILLSWITCH ENGAGED: All external tool integrations, file access, and calendar reads are temporarily blocked.
            </span>
          </div>
        )}

        {/* Subheader Tabs */}
        <div className="px-6 py-2.5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('integrations')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'integrations'
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Integrations & Scopes</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Log ({auditLogs.length})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Prompt Shield: Active
            </span>
            <span className="text-slate-600">|</span>
            <span>No Blanket All-Access</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'integrations' ? (
            <div className="space-y-4">
              {/* Category Filter */}
              <div className="flex flex-col sm:flex-row gap-2 justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search integrations or capabilities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {['all', 'productivity', 'communication', 'media', 'developer', 'system'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono capitalize transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 bg-slate-900/40'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Integrations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredIntegrations.map((item) => {
                  const Icon = ICON_MAP[item.icon] || Shield
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        item.enabled
                          ? 'border-cyan-500/30 bg-slate-900/50'
                          : 'border-slate-800/80 bg-slate-950/40 opacity-80'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl ${item.enabled ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                              <span>{item.name}</span>
                              <span className="text-[10px] text-slate-500 font-normal">({item.authType})</span>
                            </div>
                            <div className="text-[10px] text-slate-400">{item.description}</div>
                          </div>
                        </div>
                      </div>

                      {/* Scopes List */}
                      <div className="mt-3 space-y-2 pt-2 border-t border-slate-800/80">
                        {item.scopes.map((s) => (
                          <div
                            key={s.scope}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-slate-800/50 text-xs font-mono"
                          >
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleScope(item.id, s.scope, s.granted)}
                                className={`w-4 h-4 rounded flex items-center justify-center border transition-all cursor-pointer ${
                                  s.granted
                                    ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-bold'
                                    : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                                }`}
                              >
                                {s.granted && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>
                              <span className={s.granted ? 'text-white' : 'text-slate-500'}>{s.label}</span>
                            </div>
                            {getRiskBadge(s.risk)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* AUDIT LOG TAB */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono text-slate-400">
                  Showing recent data access and tool execution requests (Latest 200 entries)
                </div>
                <button
                  onClick={handleExportAudit}
                  className="px-3 py-1.5 rounded-xl border border-cyan-500/30 hover:bg-cyan-500/20 text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON Audit</span>
                </button>
              </div>

              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl glass-panel-subtle border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-white font-semibold">{log.action}</span>
                      <span className="text-cyan-400 text-[10px]">({log.scope})</span>
                      <span className="text-slate-400 text-[10px] hidden sm:inline">[{log.reason}]</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {log.channel}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          log.status === 'allowed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : log.status === 'blocked'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : log.status === 'paused'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
