import React from 'react';
import { db } from '../../../lib/db';

export default function Head({ params }: { params: { jobId: string } }) {
  const { jobId } = params;
  const job = db.getJobPostings().find(j => j.id === jobId);
  const title = job ? `${job.title} — Workforcely` : 'Job Opening — Workforcely';
  const description = job ? (job.description || `Apply for ${job.title} at Workforcely`) : 'View job opening on Workforcely';
  const url = `https://your-domain.example/recruitment/${jobId}`;
  const image = job ? `https://ui-avatars.com/api/?name=${encodeURIComponent(job.title)}&background=2563eb&color=ffffff&size=512` : undefined;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </>
  );
}
