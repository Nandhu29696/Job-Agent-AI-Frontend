const base = {
  personal: {
    full_name: 'Priya Sharma',
    headline: 'Senior Software Engineer',
    email: 'priya.sharma@email.com',
    phone: '+1 555 010 2345',
    location: 'Austin, TX',
    linkedin: 'linkedin.com/in/priyasharma',
    website: 'priya.dev',
    github: '',
    photo: '',
  },
  summary:
    'Senior software engineer with 7+ years building scalable cloud platforms. Led teams of 6 delivering microservices that serve 4M users, cut infrastructure costs by 32% and improved release velocity 3x through CI/CD automation.',
  experience: [
    {
      id: 'x1', title: 'Senior Software Engineer', company: 'CloudScale Inc.', location: 'Austin, TX',
      start: 'Mar 2021', end: '', current: true,
      bullets: [
        'Led migration of a monolith to 14 Kubernetes microservices, reducing deployment time by 70%.',
        'Cut AWS spend by 32% ($410K/yr) by introducing autoscaling and spot-instance strategies.',
        'Mentored 6 engineers and introduced code-review guidelines adopted company-wide.',
      ],
    },
    {
      id: 'x2', title: 'Software Engineer', company: 'FinEdge Labs', location: 'Dallas, TX',
      start: 'Jun 2018', end: 'Feb 2021', current: false,
      bullets: [
        'Built real-time payment APIs in Python/FastAPI processing 1.2M transactions daily.',
        'Improved p95 latency from 480ms to 120ms through query optimisation and Redis caching.',
      ],
    },
  ],
  education: [
    { id: 'e1', degree: 'B.S. Computer Science', institution: 'University of Texas at Austin', location: '', start: '2014', end: '2018', grade: 'GPA 3.8', details: '' },
  ],
  skills: [
    { id: 's1', name: 'Languages', items: ['Python', 'TypeScript', 'Go', 'SQL'] },
    { id: 's2', name: 'Cloud & DevOps', items: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'GitHub Actions'] },
  ],
  projects: [
    { id: 'p1', name: 'OpenMetrics Dashboard', role: 'Creator', link: 'github.com/priya/om', description: 'Open-source observability dashboard with 2.3K GitHub stars.', bullets: [] },
  ],
  certifications: [
    { id: 'c1', name: 'AWS Solutions Architect – Professional', issuer: 'Amazon', date: '2023', detail: '', link: '' },
  ],
  languages: [
    { id: 'l1', name: 'English', level: 'Native' },
    { id: 'l2', name: 'Hindi', level: 'Fluent' },
  ],
  interests: ['Open source', 'Mentoring', 'Trail running'],
  licenses: [], publications: [], awards: [], volunteer: [], references: [], custom_sections: [],
  declaration: '', section_order: [], hidden_sections: [],
}

const healthcare = {
  ...base,
  personal: { ...base.personal, full_name: 'Dr. Arjun Mehta', headline: 'Consultant Cardiologist, MD, DM', location: 'Mumbai, India' },
  summary:
    'Consultant cardiologist with 10+ years of clinical experience in interventional cardiology. Performed 1,500+ angioplasties with a 99.2% success rate and published 18 peer-reviewed papers.',
  experience: [
    {
      id: 'x1', title: 'Consultant Cardiologist', company: 'Apollo Hospitals', location: 'Mumbai', start: 'Jan 2018', end: '', current: true,
      bullets: ['Performed 1,500+ PCI procedures with 99.2% success rate.', 'Established a 24x7 primary angioplasty program reducing door-to-balloon time to 58 minutes.'],
    },
    {
      id: 'x2', title: 'Senior Resident, Cardiology', company: 'AIIMS', location: 'New Delhi', start: 'Jul 2014', end: 'Dec 2017', current: false,
      bullets: ['Managed 40-bed cardiac care unit and trained 12 junior residents.'],
    },
  ],
  education: [
    { id: 'e1', degree: 'DM Cardiology', institution: 'AIIMS, New Delhi', start: '2014', end: '2017', grade: '', details: '', location: '' },
    { id: 'e2', degree: 'MD Internal Medicine', institution: 'KEM Hospital, Mumbai', start: '2010', end: '2013', grade: '', details: '', location: '' },
  ],
  skills: [{ id: 's1', name: 'Clinical', items: ['Coronary angioplasty', 'Echocardiography', 'TAVR', 'Critical care'] }],
  licenses: [{ id: 'li1', name: 'Medical Council Registration', issuer: 'NMC India', date: 'Reg. No. 123456', detail: '', link: '' }],
  publications: [{ id: 'pu1', name: 'Outcomes of primary PCI in young adults', issuer: 'Indian Heart Journal', date: '2022', detail: '', link: '' }],
  projects: [],
}

export function sampleFor(category) {
  return category === 'healthcare' ? healthcare : base
}

export const EMPTY_RESUME = {
  personal: { full_name: '', headline: '', email: '', phone: '', location: '', website: '', linkedin: '', github: '', photo: '', date_of_birth: '', nationality: '', marital_status: '', gender: '', visa_status: '' },
  summary: '', experience: [], education: [], skills: [], projects: [], certifications: [], licenses: [],
  publications: [], awards: [], volunteer: [], languages: [], interests: [], references: [], declaration: '',
  custom_sections: [], section_order: [], hidden_sections: [],
}
