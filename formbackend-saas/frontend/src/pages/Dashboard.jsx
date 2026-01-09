import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function Dashboard({ user }) {
  const [stats, setStats] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem('token')

    try {
      const [statsRes, profileRes] = await Promise.all([
        fetch('/api/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const statsData = await statsRes.json()
      const profileData = await profileRes.json()

      setStats(statsData)
      setApiKey(profileData.apiKey)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
    alert('API key copied to clipboard!')
  }

  const regenerateKey = async () => {
    if (!confirm('Are you sure? This will invalidate your current API key.')) return

    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/user/regenerate-key', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setApiKey(data.apiKey)
      alert('API key regenerated!')
    } catch (err) {
      alert('Failed to regenerate key')
    }
  }

  const getLimit = () => {
    const limits = { free: 50, pro: 1000, business: '∞' }
    return limits[user.subscription_tier] || 50
  }

  if (loading) {
    return <div className="container">Loading...</div>
  }

  return (
    <div className="container">
      <h1 className="mb-20">Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Forms</div>
          <div className="stat-value">{stats?.forms || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Submissions</div>
          <div className="stat-value">{stats?.total_submissions || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">This Month</div>
          <div className="stat-value">{stats?.monthly_submissions || 0} / {getLimit()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Plan</div>
          <div className="stat-value" style={{ fontSize: '24px', textTransform: 'capitalize' }}>
            {user.subscription_tier}
          </div>
          {user.subscription_tier === 'free' && (
            <Link to="/pricing" className="btn btn-primary btn-small mt-20">Upgrade</Link>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="mb-20">Your API Key</h2>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          Use this key in your form endpoints
        </p>
        <div className="flex">
          <input
            type="text"
            className="input"
            value={apiKey}
            readOnly
            style={{ marginBottom: 0, fontFamily: 'monospace' }}
          />
          <button onClick={copyApiKey} className="btn btn-secondary">Copy</button>
          <button onClick={regenerateKey} className="btn btn-secondary">Regenerate</button>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-20">
          <h2>Quick Start</h2>
        </div>
        <Link to="/forms" className="btn btn-primary">Create Your First Form</Link>
      </div>
    </div>
  )
}

export default Dashboard
