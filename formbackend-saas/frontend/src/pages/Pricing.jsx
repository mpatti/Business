import { useNavigate } from 'react-router-dom'

function Pricing({ user }) {
  const navigate = useNavigate()

  const handleUpgrade = async (tier) => {
    if (!user) {
      navigate('/register')
      return
    }

    const token = localStorage.getItem('token')

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tier })
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      alert('Failed to start checkout')
    }
  }

  const manageSubscription = async () => {
    const token = localStorage.getItem('token')

    try {
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      alert('Failed to open billing portal')
    }
  }

  return (
    <div className="container">
      <h1 className="text-center mb-20">Choose Your Plan</h1>

      {user && user.subscription_tier !== 'free' && (
        <div className="text-center mb-20">
          <button onClick={manageSubscription} className="btn btn-secondary">
            Manage Subscription
          </button>
        </div>
      )}

      <div className="pricing-grid">
        <div className="pricing-card">
          <h3>Free</h3>
          <div className="price">$0<span style={{ fontSize: '20px' }}>/mo</span></div>
          <ul>
            <li>50 submissions/month</li>
            <li>Unlimited forms</li>
            <li>Email notifications</li>
            <li>Basic support</li>
          </ul>
          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            disabled={user?.subscription_tier === 'free'}
          >
            {user?.subscription_tier === 'free' ? 'Current Plan' : 'Downgrade'}
          </button>
        </div>

        <div className="pricing-card featured">
          <h3>Pro</h3>
          <div className="price">$15<span style={{ fontSize: '20px' }}>/mo</span></div>
          <ul>
            <li>1,000 submissions/month</li>
            <li>Unlimited forms</li>
            <li>Email notifications</li>
            <li>Priority support</li>
            <li>Custom redirects</li>
          </ul>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => handleUpgrade('pro')}
            disabled={user?.subscription_tier === 'pro'}
          >
            {user?.subscription_tier === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
          </button>
        </div>

        <div className="pricing-card">
          <h3>Business</h3>
          <div className="price">$49<span style={{ fontSize: '20px' }}>/mo</span></div>
          <ul>
            <li>Unlimited submissions</li>
            <li>Unlimited forms</li>
            <li>Email notifications</li>
            <li>Priority support</li>
            <li>Custom redirects</li>
            <li>Webhook integrations</li>
          </ul>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => handleUpgrade('business')}
            disabled={user?.subscription_tier === 'business'}
          >
            {user?.subscription_tier === 'business' ? 'Current Plan' : 'Upgrade to Business'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Pricing
