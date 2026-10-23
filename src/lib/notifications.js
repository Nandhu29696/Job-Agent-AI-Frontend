/**
 * Success notifications for every write request (POST / PATCH / PUT / DELETE),
 * shown by the API client's response interceptor. One place to edit the wording.
 *
 * Each rule: [method, url regex, (data, body, match) => string | {message, action} | null]
 * Return null to stay silent (e.g. the result is already shown on screen).
 */

const STATUS_LABEL = {
  saved: 'Saved', applied: 'Applied', interviewing: 'Interviewing', offered: 'Offered', rejected: 'Rejected',
}

const parse = (body) => {
  if (!body || typeof body !== 'string') return body || {}
  try {
    return JSON.parse(body)
  } catch {
    return {}
  }
}

const RULES = [
  // ── Auth ─────────────────────────────────────────────────────────────────
  ['post', /^\/auth\/login$/, (d) => `Welcome back${d?.user?.full_name ? `, ${d.user.full_name.split(' ')[0]}` : ''}!`],
  ['post', /^\/auth\/register$/, () => 'Account created — check your email for the verification code'],
  ['post', /^\/auth\/verify-email$/, () => 'Email verified — welcome aboard!'],
  ['post', /^\/auth\/resend-otp/, () => 'A new code is on its way'],
  ['post', /^\/auth\/refresh$/, () => null],
  ['post', /^\/auth\/logout$/, () => 'Signed out'],
  ['post', /^\/auth\/logout-all$/, () => 'Signed out from all devices'],
  ['post', /^\/auth\/forgot-password$/, () => 'If an account exists, a reset code has been sent'],
  ['post', /^\/auth\/reset-password$/, () => 'Password updated — please sign in'],
  ['post', /^\/auth\/change-password$/, (_d, b) =>
    b.current_password ? 'Password changed — other devices were signed out' : 'Password set — you can now sign in with email too'],

  // ── Profile ──────────────────────────────────────────────────────────────
  ['patch', /^\/users\/me$/, () => 'Profile updated'],
  ['patch', /^\/employees\/me$/, () => 'Career profile saved'],

  // ── Resumes ──────────────────────────────────────────────────────────────
  ['post', /^\/resumes\/$/, () => 'Resume created'],
  ['post', /^\/resumes\/import$/, () => 'Resume imported — review the details AI extracted'],
  ['patch', /^\/resumes\/\d+$/, (_d, b) => (b.is_primary ? 'Set as your primary resume' : 'Resume saved')],
  ['delete', /^\/resumes\/\d+$/, () => 'Resume deleted'],
  ['post', /^\/resumes\/\d+\/duplicate$/, () => 'Resume duplicated'],
  ['post', /^\/resumes\/\d+\/ats$/, (d) => `ATS scan complete — score ${d?.score}/100`],
  ['post', /^\/resumes\/\d+\/adapt-country$/, (d) => `${d?.rules?.name || 'Country'} format preview ready`],
  ['post', /^\/resumes\/\d+\/download$/, () => 'Preparing your PDF…'],

  // ── Resume AI ────────────────────────────────────────────────────────────
  ['post', /^\/resume-ai\/enhance-summary$/, () => 'AI summary suggestions ready'],
  ['post', /^\/resume-ai\/enhance-bullets$/, () => 'AI bullet suggestions ready'],
  ['post', /^\/resume-ai\/suggest-skills$/, () => 'Suggested skills added'],
  ['post', /^\/resume-ai\/tailor$/, (d) => `Tailored preview ready — ATS ${d?.ats_before} → ${d?.ats_after}`],
  ['post', /^\/resume-ai\/ats-check/, (d) => `ATS scan complete — score ${d?.score}/100`],
  ['post', /^\/resume-ai\/cover-letter$/, () => 'Cover letter generated'],

  // ── Agent ────────────────────────────────────────────────────────────────
  ['post', /^\/agent\/chat$/, (d) => {
    const acted = d?.steps?.find((s) => ['save_job', 'update_application_status'].includes(s.tool))
    return acted ? `AI agent: ${acted.summary}` : null // plain replies are already visible in the chat
  }],
  ['post', /^\/agent\/cover-letter\/\d+$/, () => 'Cover letter generated'],
  ['post', /^\/agent\/match-score\/\d+$/, (d) => `Match score: ${Math.round(d?.score ?? 0)}%`],

  // ── Jobs & applications ──────────────────────────────────────────────────
  ['post', /^\/jobs\/$/, () => 'Job posted'],
  ['patch', /^\/jobs\/\d+$/, () => 'Job updated'],
  ['delete', /^\/jobs\/\d+$/, () => 'Job deleted'],
  ['post', /^\/applications\/$/, () => ({ message: 'Saved to your applications', action: { to: '/applications', label: 'View' } })],
  ['patch', /^\/applications\/\d+$/, (d, b) =>
    b.status ? `Moved to ${STATUS_LABEL[b.status] || b.status}` : b.notes !== undefined ? 'Notes saved' : 'Application updated'],
  ['delete', /^\/applications\/\d+$/, () => 'Application removed'],

  // ── Payments ─────────────────────────────────────────────────────────────
  ['post', /^\/payments\/orders$/, () => null], // checkout window opens
  ['post', /^\/payments\/verify$/, (d) => (d?.item_type === 'pro_plan' ? 'Payment successful — welcome to Pro! 🎉' : 'Payment successful — template unlocked! 🎉')],

  // ── Admin ────────────────────────────────────────────────────────────────
  ['patch', /^\/admin\/users\/\d+$/, () => 'User updated'],
  ['delete', /^\/admin\/users\/\d+$/, () => 'User deleted'],
  ['post', /^\/admin\/users\/\d+\/force-logout$/, () => 'User signed out from all devices'],
  ['post', /^\/admin\/users\/\d+\/grant-template$/, () => 'Template granted'],
  ['patch', /^\/admin\/templates\/\d+$/, () => 'Template saved'],
  ['put', /^\/admin\/settings$/, () => 'Settings saved'],
]

const FALLBACK = { post: 'Done', patch: 'Changes saved', put: 'Changes saved', delete: 'Deleted' }

export function successNotification(config, data) {
  const method = (config.method || 'get').toLowerCase()
  if (method === 'get' || config.silent) return null
  const url = (config.url || '').split('?')[0]
  const body = config.data instanceof FormData ? {} : parse(config.data)
  for (const [m, re, fn] of RULES) {
    if (m === method && re.test(url)) {
      const out = fn(data, body)
      if (!out) return null
      return typeof out === 'string' ? { message: out } : out
    }
  }
  return FALLBACK[method] ? { message: FALLBACK[method] } : null
}
