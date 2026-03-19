import { useState } from 'react'
import { supabase } from './supabase'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account.')
    }

    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '12px', background: 'rgba(0,0,0,0.02)', fontSize: '13px',
    color: '#2a2a2a', outline: 'none', boxSizing: 'border-box',
    letterSpacing: '0.3px'
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#f7f4f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

      {/* Background dots */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.15) 1.5px, transparent 1.5px)',
        backgroundSize: '25px 25px',
      }} />

      {/* Glow orb */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,220,180,0.3) 0%, transparent 70%)',
      }} />

      {/* Title */}
      <div style={{ position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 1 }}>
        <h1 className="app-title">TAZKIYATI</h1>
        <p className="app-subtitle">heart purity tracker</p>
      </div>

      {/* Form */}
      <div className="card" style={{
        position: 'relative', zIndex: 1,
        background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.08)'
      }}>
        <p style={{ fontSize: '11px', letterSpacing: '4px', color: '#999', textTransform: 'uppercase', margin: '0 0 28px', textAlign: 'center' }}>
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle} required
          />
          <input
            type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle} required
          />

          {error && <p style={{ fontSize: '11px', color: '#c47a7a', textAlign: 'center', margin: 0 }}>{error}</p>}
          {message && <p style={{ fontSize: '11px', color: '#7a9e7e', textAlign: 'center', margin: 0 }}>{message}</p>}

          <button type="submit" disabled={loading} style={{
            marginTop: '8px', padding: '13px', border: 'none', borderRadius: '12px',
            background: '#2a2a2a', color: '#f7f4f0', fontSize: '11px', letterSpacing: '3px',
            textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s'
          }}>
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null) }} style={{
          marginTop: '20px', width: '100%', background: 'none', border: 'none',
          cursor: 'pointer', fontSize: '11px', letterSpacing: '2px', color: '#bbb',
          textTransform: 'uppercase'
        }}>
          {mode === 'login' ? 'No account? Sign up' : 'Have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
