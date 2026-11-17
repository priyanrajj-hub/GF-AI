import React, { useState } from 'react'
import { Mail, CheckCircle2, AlertCircle, Loader2, X, Lock, KeyRound } from 'lucide-react'
import { apiUrl, setAuthToken, setRefreshToken } from '../../utils/api.js'
import { useAppStore } from '../../store/useAppStore.js'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { setCurrentUser } = useAppStore()
  const [email, setEmail] = useState('')
  const [manualToken, setManualToken] = useState('')
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const res = await fetch(apiUrl('/api/auth/magic-link/request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await res.json()
      if (res.ok) {
        setStatusMessage(data.message || 'Magic login link dispatched! Check your inbox.')
        setStep('verify')
        // If non-prod testToken returned, pre-fill for ease of testing
        if (data.testToken) {
          setManualToken(data.testToken)
        }
      } else {
        setErrorMessage(data.error || 'Failed to request magic login link.')
      }
    } catch (err: any) {
      setErrorMessage('Network error while requesting login link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualToken.trim()) {
      setErrorMessage('Please enter your verification token from the email.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const res = await fetch(apiUrl('/api/auth/magic-link/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          token: manualToken.trim(),
        }),
      })

      const data = await res.json()
      if (res.ok && data.token) {
        setAuthToken(data.token)
        if (data.refreshToken) {
          setRefreshToken(data.refreshToken)
        }
        setCurrentUser(data.user)
        setStatusMessage('Authentication successful! Welcome to Jarvis / GF-AI.')
        setTimeout(() => {
          onClose()
          setStep('request')
          setStatusMessage(null)
        }, 1200)
      } else {
        setErrorMessage(data.error || 'Verification failed. Link or token may be expired.')
      }
    } catch {
      setErrorMessage('Network error during verification. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-cyan-500/30 bg-slate-950 p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/20 p-2.5 text-cyan-400 border border-cyan-500/40">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-cyan-300">Jarvis & GF-AI Authentication</h3>
            <p className="text-xs text-slate-400">Zero-Trust Passwordless Cryptographic Sign-In</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {statusMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleSendMagicLink} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                We will dispatch a secure 15-minute single-use authentication link.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Send Magic Login Link
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyToken} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Verification Token / Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste token from email link"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Verification code expires in 15 minutes and can only be used once.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="w-1/3 rounded-xl border border-slate-800 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-900"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-2/3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm & Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
