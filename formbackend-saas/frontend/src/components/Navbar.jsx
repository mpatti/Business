import { Link } from 'react-router-dom'

function Navbar({ user, logout }) {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="logo">FormBackend</Link>
        <div className="nav-links">
          {user ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/forms" className="nav-link">Forms</Link>
              <Link to="/pricing" className="nav-link">Pricing</Link>
              <button onClick={logout} className="btn btn-secondary btn-small">Logout</button>
            </>
          ) : (
            <>
              <Link to="/pricing" className="nav-link">Pricing</Link>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn btn-primary btn-small">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
