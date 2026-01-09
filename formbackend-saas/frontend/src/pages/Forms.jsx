import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function Forms() {
  const [forms, setForms] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [newForm, setNewForm] = useState({ name: '', notification_email: '', redirect_url: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchForms()
  }, [])

  const fetchForms = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/forms', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setForms(data)
    } catch (err) {
      console.error('Error fetching forms:', err)
    } finally {
      setLoading(false)
    }
  }

  const createForm = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')

    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newForm)
      })

      if (res.ok) {
        setShowModal(false)
        setNewForm({ name: '', notification_email: '', redirect_url: '' })
        fetchForms()
      }
    } catch (err) {
      alert('Failed to create form')
    }
  }

  const deleteForm = async (id) => {
    if (!confirm('Are you sure? This will delete all submissions too.')) return

    const token = localStorage.getItem('token')
    try {
      await fetch(`/api/forms/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      fetchForms()
    } catch (err) {
      alert('Failed to delete form')
    }
  }

  if (loading) {
    return <div className="container">Loading...</div>
  }

  return (
    <div className="container">
      <div className="flex-between mb-20">
        <h1>Forms</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          Create New Form
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="card text-center">
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>No forms yet</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            Create Your First Form
          </button>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Form Key</th>
                <th>Submissions</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {forms.map(form => (
                <tr key={form.id}>
                  <td>{form.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    {form.form_key.substring(0, 8)}...
                  </td>
                  <td>{form.submission_count}</td>
                  <td>{new Date(form.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex">
                      <Link to={`/forms/${form.id}`} className="btn btn-secondary btn-small">
                        View
                      </Link>
                      <button
                        onClick={() => deleteForm(form.id)}
                        className="btn btn-danger btn-small"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Form</h2>
            <form onSubmit={createForm}>
              <div className="form-group">
                <label className="label">Form Name *</label>
                <input
                  type="text"
                  className="input"
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  placeholder="Contact Form"
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Notification Email (optional)</label>
                <input
                  type="email"
                  className="input"
                  value={newForm.notification_email}
                  onChange={(e) => setNewForm({ ...newForm, notification_email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div className="form-group">
                <label className="label">Redirect URL (optional)</label>
                <input
                  type="url"
                  className="input"
                  value={newForm.redirect_url}
                  onChange={(e) => setNewForm({ ...newForm, redirect_url: e.target.value })}
                  placeholder="https://yoursite.com/thank-you"
                />
              </div>
              <div className="flex">
                <button type="submit" className="btn btn-primary">Create Form</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Forms
