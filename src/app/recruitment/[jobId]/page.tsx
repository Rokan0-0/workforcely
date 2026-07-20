'use client';

import React, { useEffect, useState } from 'react';

export default function JobDetailPage({ params }: { params: { jobId: string } }) {
  const { jobId } = params;
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cover, setCover] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJob() {
      try {
        setLoading(true);
        const res = await fetch('/api/recruitment');
        if (res.ok) {
          const data = await res.json();
          const found = data.jobPostings.find((j: any) => j.id === jobId);
          setJob(found || null);
        }
      } catch (err) {
        console.error('Failed to load job', err);
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [jobId]);

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    let resumeUrl = '';
    try {
      if (resumeFile) resumeUrl = await readFileAsDataUrl(resumeFile);
      const res = await fetch('/api/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          jobId,
          name,
          email,
          cover,
          resumeUrl
        })
      });
      if (res.ok) {
        setMessage('Application submitted — thank you!');
        setName(''); setEmail(''); setCover(''); setResumeFile(null);
        window.setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage('Failed to submit application.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Submission error');
    }
  };

  if (loading) return <div style={{ padding: 32 }}>Loading...</div>;
  if (!job) return <div style={{ padding: 32 }}>Job not found.</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2>{job.title}</h2>
      <p style={{ color: 'var(--text-muted)' }}>{job.description}</p>
      {job.closingDate && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Closing: {job.closingDate}</p>}

      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(window.location.href); }}
        >
          Copy Link
        </button>
        <a
          href={`mailto:?subject=${encodeURIComponent('Job: ' + job.title)}&body=${encodeURIComponent(window.location.href)}`}
          onClick={(e) => e.stopPropagation()}
          className="btn-secondary"
          style={{ padding: '6px 10px', textDecoration: 'none' }}
        >
          Email
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(job.title + ' ' + window.location.href)}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="btn-secondary"
          style={{ padding: '6px 10px', textDecoration: 'none' }}
        >
          WhatsApp
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="btn-secondary"
          style={{ padding: '6px 10px', textDecoration: 'none' }}
        >
          LinkedIn
        </a>
      </div>

      <div style={{ marginTop: 24, maxWidth: 640 }}>
        <h3>Apply for this role</h3>
        {message && <div style={{ marginBottom: 12, color: 'var(--success)' }}>{message}</div>}
        <form onSubmit={handleApply} style={{ display: 'grid', gap: 12 }}>
          <input required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="form-control" />
          <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" />
          <textarea placeholder="Cover note (optional)" value={cover} onChange={(e) => setCover(e.target.value)} className="form-control" rows={4} />
          <input type="file" accept="application/pdf,image/*" onChange={(e) => setResumeFile(e.target.files ? e.target.files[0] : null)} />
          <button type="submit" className="btn-primary">Submit Application</button>
        </form>
      </div>
    </div>
  );
}
