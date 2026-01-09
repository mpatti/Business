import { Link } from 'react-router-dom'

function Home() {
  return (
    <div>
      <div className="hero">
        <h1>Form Backend for Static Sites</h1>
        <p>Accept form submissions without writing backend code</p>
        <Link to="/register" className="btn btn-primary">Get Started Free</Link>
      </div>

      <div className="container">
        <div className="card">
          <h2 className="mb-20">How It Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            <div>
              <h3>1. Create a Form</h3>
              <p style={{ color: '#6b7280' }}>Sign up and create a form endpoint in your dashboard</p>
            </div>
            <div>
              <h3>2. Add to Your Site</h3>
              <p style={{ color: '#6b7280' }}>Point your HTML form to our endpoint</p>
            </div>
            <div>
              <h3>3. Receive Submissions</h3>
              <p style={{ color: '#6b7280' }}>View submissions in your dashboard and get email notifications</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-20">Example Usage</h2>
          <p style={{ marginBottom: '16px' }}>Just point your form to our API:</p>
          <div className="code-block">
{`<form action="https://api.formbackend.io/submit/YOUR_FORM_KEY" method="POST">
  <input type="text" name="name" placeholder="Name" required />
  <input type="email" name="email" placeholder="Email" required />
  <textarea name="message" placeholder="Message"></textarea>
  <button type="submit">Send</button>
</form>`}
          </div>
        </div>

        <div className="card text-center">
          <h2 className="mb-20">Ready to get started?</h2>
          <Link to="/register" className="btn btn-primary">Create Free Account</Link>
        </div>
      </div>
    </div>
  )
}

export default Home
