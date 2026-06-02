import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { authApi, employeeApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { Save } from 'lucide-react'

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const isEmployee = user?.role === 'employee'

  const [nameForm, setNameForm] = useState({ full_name: '' })
  const [empForm, setEmpForm] = useState({
    skills: '',
    resume_text: '',
    experience_years: '',
    education: '',
    phone: '',
    linkedin_url: '',
  })
  const [saved, setSaved] = useState(false)

  // Load user name
  useEffect(() => {
    if (user) setNameForm({ full_name: user.full_name || '' })
  }, [user])

  // Load employee profile (only for employees)
  const { data: empProfile } = useQuery({
    queryKey: ['employee-me'],
    queryFn: () => employeeApi.getMyProfile().then((r) => r.data),
    enabled: isEmployee,
  })

  useEffect(() => {
    if (empProfile) {
      setEmpForm({
        skills: empProfile.skills || '',
        resume_text: empProfile.resume_text || '',
        experience_years: empProfile.experience_years ?? '',
        education: empProfile.education || '',
        phone: empProfile.phone || '',
        linkedin_url: empProfile.linkedin_url || '',
      })
    }
  }, [empProfile])

  // Update user name
  const updateUser = useMutation({
    mutationFn: (data) => authApi.updateMe(data),
    onSuccess: ({ data }) => {
      setUser(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  // Update employee profile
  const updateEmp = useMutation({
    mutationFn: (data) => employeeApi.updateMyProfile(data),
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    updateUser.mutate(nameForm)
    if (isEmployee) {
      const payload = { ...empForm }
      if (payload.experience_years === '') delete payload.experience_years
      else payload.experience_years = parseFloat(payload.experience_years)
      updateEmp.mutate(payload)
    }
  }

  const isPending = updateUser.isPending || updateEmp.isPending

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {/* ── Account info ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            className="input"
            value={nameForm.full_name}
            onChange={(e) => setNameForm({ ...nameForm, full_name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input className="input bg-gray-50" value={user?.email || ''} disabled />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <input
            className="input bg-gray-50 capitalize"
            value={user?.role || ''}
            disabled
          />
        </div>

        {/* ── Employee-only fields ── */}
        {isEmployee && (
          <>
            <hr className="border-gray-200" />
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Employee Profile</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skills <span className="text-gray-400 font-normal">(comma-separated, used for job matching)</span>
              </label>
              <input
                className="input"
                placeholder="python,fastapi,react,sql…"
                value={empForm.skills}
                onChange={(e) => setEmpForm({ ...empForm, skills: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  className="input"
                  placeholder="3"
                  value={empForm.experience_years}
                  onChange={(e) => setEmpForm({ ...empForm, experience_years: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  className="input"
                  placeholder="+1 555 000 0000"
                  value={empForm.phone}
                  onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
              <input
                className="input"
                placeholder="https://linkedin.com/in/yourname"
                value={empForm.linkedin_url}
                onChange={(e) => setEmpForm({ ...empForm, linkedin_url: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
              <input
                className="input"
                placeholder="B.Sc. Computer Science, MIT 2020"
                value={empForm.education}
                onChange={(e) => setEmpForm({ ...empForm, education: e.target.value })}
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
                value={empForm.resume_text}
                onChange={(e) => setEmpForm({ ...empForm, resume_text: e.target.value })}
              />
            </div>
          </>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={isPending}>
            <Save size={15} />
            {isPending ? 'Saving…' : 'Save Profile'}
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
        </div>
      </form>
    </div>
  )
}

