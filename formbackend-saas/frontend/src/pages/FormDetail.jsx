import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

function FormDetail() {
  const { id } = useParams()
  const [form, setForm] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFormData()
  }, [id])

  const fetchFormData = async () => {
    const token = localStorage.getItem('token')

    try {
      const [formRes, submissionsRes] = await Promise.all([
        fetch(`/api/forms/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/forms/${id}/submissions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const formData = await formRes.json()
      const submissionsData = await submissionsRes.json()

      setForm(formData)
      setSubmissions(submissionsData)
    } catch (err) {
      console.error('Error fetching form:', err)
    } finally {
      setLoading(false)
    }
  }

  const copyEndpoint = () => {
    const endpoint = `${window.location.origin}/submit/${form.form_key}`
    navigator.clipboard.writeText(endpoint)
    alert('Endpoint copied to clipboard!')
  }

  if (loading) {
    return <div className="container">Loading...</div>
  }

  if (!form) {
    return <div className="container">Form not found</div>
  }

  const endpoint = `${window.location.origin}/submit/${form.form_key}`

  return (
    <div className="container">
      <div className="mb-20">
        <Link to="/forms" style={{ color: '#4f46e5' }}>← Back to Forms</Link>
      </div>

      <h1 className="mb-20">{form.name}</h1>

      <div className="card">
        <h2 className="mb-20">Form Endpoint</h2>
        <div className="flex" style={{ marginBottom: '16px' }}>
          <input
            type="text"
            className="input"
            value={endpoint}
            readOnly
            style={{ marginBottom: 0, fontFamily: 'monospace' }}
          />
          <button onClick={copyEndpoint} className="btn btn-secondary">Copy</button>
        </div>

        <h3 style={{ marginTop: '24px', marginBottom: '12px' }}>Example HTML:</h3>
        <div className="code-block">
{`<form action="${endpoint}" method="POST">
  <input type="text" name="name" required />
  <input type="email" name="email" required />
  <textarea name="message"></textarea>
  <button type="submit">Submit</button>
</form>`}
        </div>

        {form.notification_email && (
          <p style={{ marginTop: '16px' }}>
            <strong>Notification Email:</strong> {form.notification_email}
          </p>
        )}
        {form.redirect_url && (
          <p>
            <strong>Redirect URL:</strong> {form.redirect_url}
          </p>
        )}
      </div>

      <div className="card">
        <h2 className="mb-20">Submissions ({submissions.length})</h2>

        {submissions.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No submissions yet</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {submissions.map((submission, idx) => (
              <div key={submission.id} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <strong>Submission #{submissions.length - idx}</strong>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>
                    {new Date(submission.created_at).toLocaleString()}
                  </span>
                </div>
                <table style={{ width: '100%' }}>
                  <tbody>
                    {Object.entries(submission.data).map(([key, value]) => (
                      <tr key={key}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6', fontWeight: '500' }}>
                          {key}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {submission.ip_address && (
                  <p style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
                    IP: {submission.ip_address}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FormDetail
