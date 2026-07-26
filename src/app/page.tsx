'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    async function initAndRedirect() {
      try {
        await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: 'emp-2' })
        });
      } catch (err) {
        console.error('Init auth error', err);
      } finally {
        router.replace('/dashboard/training');
      }
    }
    initAndRedirect();
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#00D600',
      fontFamily: "'Outfit', sans-serif",
      fontSize: '18px',
      fontWeight: 700
    }}>
      Loading WorkforceMS LMS Portal...
    </div>
  );
}
