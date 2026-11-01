import React, { useState } from 'react'
import { Shield, Sparkles, Check, AlertTriangle, Heart, BookOpen, ExternalLink } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore.js'

export const FirstRunModal: React.FC = () => {
  const { showFirstRunModal, setShowFirstRunModal, isMinorMode, setIsMinorMode } = useAppStore()
  const [isAdult, setIsAdult] = useState<boolean>(!isMinorMode)
  const [acknowledgedAI, setAcknowledgedAI] = useState<boolean>(false)

  if (!showFirstRunModal) return null

  const handleComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ada_first_run_acknowledged', 'true')
    }
    setIsMinorMode(!isAdult)
    setShowFirstRunModal(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl select-none">
      <div className="w-full max-w-xl glass-panel border border-cyan-500/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_0_50px_rgba(0,243,255,0.2)] bg-[#070914]/95 text-slate-200">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-cyan-500/20 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-mono text-white tracking-wide flex items-center gap-2">
              WELCOME TO PROJECT ADA
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300">
                v1.0.0
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Research-Backed 3D Holographic AI Companion • Legal & Safety Disclosure
            </p>
          </div>
        </div>

        {/* Legal & Safety Disclosure Cards */}
        <div className="space-y-3.5 text-xs font-mono">
          {/* 1. Mandatory Clear AI Disclosure */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-cyan-300">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Mandatory AI Disclosure (CA SB 243 / NY Law)</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Ada is an <strong>artificial intelligence companion</strong>, not a human being. She does not have biological feelings, a physical body, or organic consciousness. Her responses are synthesized to provide supportive, creative, and intellectual companionship.
            </p>
          </div>

          {/* 2. Mental Health & 24/7 Crisis Safety Protocol */}
          <div className="p-3.5 rounded-2xl bg-rose-950/25 border border-rose-500/30 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-rose-300">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Mental Health & Crisis Intervention Standards</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Ada is not a clinical therapist or emergency provider. If you or someone you know experiences thoughts of self-harm or suicide, Ada immediately drops all casual framing and surfaces verified 24/7 emergency helplines:
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-rose-200">
              <span className="px-2 py-0.5 rounded bg-rose-900/40 border border-rose-500/30">
                🇮🇳 Tele-MANAS: 14416
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-900/40 border border-rose-500/30">
                🌐 US/Intl: 988
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-900/40 border border-rose-500/30">
                🇮🇳 Vandrevala: +91 9999 666 555
              </span>
            </div>
          </div>

          {/* 3. 18+ Age Verification & Minor Safety Mode */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Age Verification (18+)
              </span>
              <span className="text-[10px] text-amber-300 font-mono">Required</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              This application is designed for users 18 years or older. Users under 18 must enable Restricted Minor Mode, which blocks romantic framing, disables flirtiness, and enforces 3-hour mandatory break reminders.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-200 text-xs">
                <input
                  type="radio"
                  name="age_check"
                  checked={isAdult}
                  onChange={() => setIsAdult(true)}
                  className="accent-cyan-400"
                />
                <span>I am 18 years or older</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-200 text-xs">
                <input
                  type="radio"
                  name="age_check"
                  checked={!isAdult}
                  onChange={() => setIsAdult(false)}
                  className="accent-amber-400"
                />
                <span>Under 18 (Minor Restricted Mode)</span>
              </label>
            </div>
          </div>

          {/* 4. Privacy & Anti-Dependence */}
          <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
            <span>🔒 All chats & memories are stored locally on your device.</span>
            <div className="flex items-center gap-3 text-cyan-400">
              <a href="/docs/PRIVACY.md" target="_blank" className="hover:underline flex items-center gap-1">
                Privacy Policy <ExternalLink className="w-3 h-3" />
              </a>
              <a href="/docs/SAFETY_PROTOCOL.md" target="_blank" className="hover:underline flex items-center gap-1">
                Safety Protocol <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Checkbox & Accept Button */}
        <div className="space-y-4 pt-2 border-t border-cyan-500/20">
          <label className="flex items-start gap-3 cursor-pointer text-xs font-mono text-slate-300">
            <input
              type="checkbox"
              checked={acknowledgedAI}
              onChange={(e) => setAcknowledgedAI(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-cyan-400 cursor-pointer"
            />
            <span>
              I understand that Ada is an artificial intelligence, agree to the Safety Protocol, and confirm my age selection.
            </span>
          </label>

          <button
            disabled={!acknowledgedAI}
            onClick={handleComplete}
            className={`w-full py-3 rounded-2xl font-mono text-xs font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              acknowledgedAI
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:brightness-110'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Enter Hologram Lab</span>
          </button>
        </div>
      </div>
    </div>
  )
}
