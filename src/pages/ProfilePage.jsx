import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { Save } from 'lucide-react'

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [form, setForm] = useState({
    full_name: '',
    resume_text: '',
    skills: '',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        resume_text: user.resume_text || '',
        skills: user.skills || '',
      })
    }
  }, [user])

  const update = useMutation({
    mutationFn: (data) => authApi.updateMe(data),
    onSuccess: ({ data }) => {
      setUser(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    update.mutate(form)
  }

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            className="input"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input className="input bg-gray-50" value={user?.email || ''} disabled />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Skills <span className="text-gray-400 font-normal">(comma-separated)</span>
          </label>
          <input
            className="input"
            placeholder="React, Python, SQL, Machine Learning…"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resume / Background{' '}
            <span className="text-gray-400 font-normal">(paste your resume text — enables AI features)</span>
          </label>
          <textarea
            rows={12}
            className="input font-mono text-xs"
            placeholder="Paste your resume here…"
            value={form.resume_text}
            onChange={(e) => setForm({ ...form, resume_text: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={update.isPending}>
            <Save size={15} />
            {update.isPending ? 'Saving…' : 'Save Profile'}
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
        </div>
      </form>
    </div>
  )
}
