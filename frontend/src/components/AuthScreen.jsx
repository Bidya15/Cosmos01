import React, { useState } from 'react'
import { useCosmosStore } from '../store/cosmosStore'

/**
 * Authentication & Recovery Terminal.
 * Supports: LOGIN, REGISTER, FORGOT_PWD, RESET_PWD modes.
 */
export default function AuthScreen() {
  const [view, setView] = useState('LOGIN') // LOGIN, REGISTER, FORGOT, RESET
  const [showPassword, setShowPassword] = useState(false)
  
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const { login, register, forgotPassword, resetPassword } = useCosmosStore()

  const resetForm = () => {
    setError('')
    setMessage('')
    setIsLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    resetForm()
    setIsLoading(true)

    let res
    try {
      if (view === 'LOGIN') {
        res = await login(email, password)
      } else if (view === 'REGISTER') {
        res = await register(username, email, password)
        if (res.success) {
          setView('LOGIN')
          setMessage('Signal registered! You may now establish a link.')
        }
      } else if (view === 'FORGOT') {
        res = await forgotPassword(email)
        if (res.success) {
          setView('RESET')
          setMessage('Signal verified. Please input your new encryption keys.')
        }
      } else if (view === 'RESET') {
        res = await resetPassword(email, newPassword)
        if (res.success) {
          setView('LOGIN')
          setMessage('Signal re-encrypted successfully. Establishing link...')
        }
      }

      if (res && !res.success) {
        setError(res.error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getTitle = () => {
    if (view === 'LOGIN') return 'Establish Link'
    if (view === 'REGISTER') return 'Register Signal'
    if (view === 'FORGOT') return 'Recover Signal'
    if (view === 'RESET') return 'Update Protocol'
    return 'Cosmos Terminal'
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-cosmos-space p-6 overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600 rounded-full blur-[120px]" />
      </div>

      <div 
        className="relative w-full max-w-md p-8 sm:p-10"
        style={{
          background: 'rgba(5, 8, 17, 0.8)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          backdropFilter: 'blur(20px)',
          clipPath: 'polygon(20px 0%, 100% 0%, calc(100% - 20px) 100%, 0% 100%)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="text-center mb-10">
          <div className="connection-pulse w-3 h-3 bg-cyan-400 rounded-full mx-auto mb-3" 
               style={{ boxShadow: '0 0 12px rgba(6, 182, 212, 0.8)' }} />
          <h1 className="font-display text-2xl tracking-[0.2em] text-white mb-2 uppercase">{getTitle()}</h1>
          <p className="font-display text-[9px] text-white/40 tracking-widest uppercase italic opacity-60">
            {view === 'LOGIN' && 'Establish synchronization with the virtual office'}
            {view === 'REGISTER' && 'Create your unique identity in the Cosmos'}
            {view === 'FORGOT' && 'Identify your frequency to regain access'}
            {view === 'RESET' && 'Establish a new high-entropy encryption key'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {view === 'REGISTER' && (
            <div>
              <label className="block font-display text-[9px] tracking-widest text-blue-400 mb-2 uppercase ml-3">Username</label>
              <input
                type="text" required value={username} onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 px-4 py-3 font-body text-sm text-white/80 outline-none focus:border-blue-500/40 transition-colors"
                style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)' }}
                placeholder="Star-Walker"
              />
            </div>
          )}

          {(view === 'LOGIN' || view === 'REGISTER' || view === 'FORGOT') && (
            <div>
              <label className="block font-display text-[9px] tracking-widest text-blue-400 mb-2 uppercase ml-3">Frequency (Email)</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 px-4 py-3 font-body text-sm text-white/80 outline-none focus:border-blue-500/40 transition-colors"
                style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)' }}
                placeholder="commander@cosmos.exe"
              />
            </div>
          )}

          {(view === 'LOGIN' || view === 'REGISTER') && (
            <div>
              <div className="flex justify-between items-center mb-2 px-3">
                <label className="font-display text-[9px] tracking-widest text-blue-400 uppercase">
                  {view === 'REGISTER' ? 'New Enigma (Password)' : 'Enigma (Password)'}
                </label>
                {view === 'LOGIN' && (
                  <button type="button" onClick={() => setView('FORGOT')} className="text-[8px] text-white/30 hover:text-blue-400/60 uppercase tracking-tighter">Lost Signal?</button>
                )}
              </div>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 px-4 py-3 font-body text-sm text-white/80 outline-none focus:border-blue-500/40 transition-colors pr-12"
                  style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)' }}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-display text-white/20 hover:text-white/60 uppercase">{showPassword ? 'HIDE' : 'SHOW'}</button>
              </div>
            </div>
          )}

          {view === 'RESET' && (
            <div>
              <label className="block font-display text-[9px] tracking-widest text-blue-400 mb-2 uppercase ml-3">New Protocol (New Password)</label>
              <input
                type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 px-4 py-3 font-body text-sm text-white/80 outline-none focus:border-blue-500/40 transition-colors"
                style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)' }}
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <div className="text-pink-500 font-display text-[9px] tracking-wider text-center bg-pink-500/5 py-2">
              {typeof error === 'object' ? (error.message || error.error || JSON.stringify(error)) : error}
            </div>
          )}
          {message && <div className="text-cyan-400 font-display text-[9px] tracking-wider text-center bg-cyan-400/5 py-2">{message}</div>}

          <button
            type="submit" disabled={isLoading}
            className="w-full py-4 font-display text-xs tracking-[0.3em] uppercase bg-blue-600/20 border border-blue-600/40 text-blue-400 hover:bg-blue-600/30 transition-all disabled:opacity-50"
            style={{ clipPath: 'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)' }}
          >
            {isLoading ? 'SYNCING...' : view}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          {view === 'LOGIN' && (
            <button onClick={() => { resetForm(); setView('REGISTER'); }} className="font-display text-[9px] tracking-[0.2em] text-white/30 hover:text-white/80 transition-colors uppercase">
              Need a signal ID? Register here
            </button>
          )}
          {(view === 'REGISTER' || view === 'FORGOT' || view === 'RESET') && (
            <button onClick={() => { resetForm(); setView('LOGIN'); }} className="font-display text-[9px] tracking-[0.2em] text-white/30 hover:text-white/80 transition-colors uppercase">
              Return to primary terminal
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
