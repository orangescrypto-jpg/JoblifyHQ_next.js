const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export const fetchJobs = async () => {
  await delay(800);
  return [
    { id: '1', title: 'Frontend Developer', company: 'TechNova', location: 'Remote', type: 'Full-time', category: 'Engineering', deadline: '2026-06-15', description: 'Build scalable React interfaces.', salary: '$90k-$120k', posted: '2d ago' },
    { id: '2', title: 'Data Analyst', company: 'FinServe', location: 'New York, USA', type: 'Part-time', category: 'Finance', deadline: '2026-05-30', description: 'Analyze financial datasets with SQL & Python.', salary: '$60k-$80k', posted: '1w ago' },
    { id: '3', title: 'UX/UI Designer', company: 'CreativeHub', location: 'London, UK', type: 'Remote', category: 'Design', deadline: '2026-07-01', description: 'Design user-centric web experiences.', salary: '$75k-$95k', posted: '3d ago' },
  ];
};

export const fetchScholarships = async () => {
  await delay(800);
  return [
    { id: 's1', title: 'Global STEM Excellence Award', org: 'EduFoundation', country: 'USA', type: 'Full Funding', deadline: '2026-08-30', description: 'For international students pursuing STEM degrees.', benefits: 'Tuition + $15k stipend', posted: '1w ago' },
    { id: 's2', title: 'Future Leaders Grant', org: 'GlobalTrust', country: 'UK', type: 'Partial Funding', deadline: '2026-07-15', description: 'Supporting students from developing nations.', benefits: '50% tuition waiver', posted: '3d ago' },
  ];
};

export const fetchBlogs = async () => {
  await delay(800);
  return [
    { id: 'b1', title: 'How to Ace Technical Interviews in 2026', excerpt: 'Master the STAR method, practice system design, and learn what hiring managers actually look for.', author: 'Sarah Chen', date: 'May 1, 2026', category: 'Career Tips', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80' },
    { id: 'b2', title: 'Top 10 Remote Work Productivity Hacks', excerpt: 'Stop procrastinating and build deep work habits that scale with distributed teams.', author: 'Mark Davies', date: 'Apr 28, 2026', category: 'Remote Work', image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80' },
  ];
};
