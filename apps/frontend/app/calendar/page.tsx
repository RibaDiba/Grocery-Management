"use client";

import { useRouter } from 'next/navigation';
import CalendarOverlay from '../components/CalendarOverlay';

export default function CalendarPage() {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  return (
    <CalendarOverlay
      isOpen={true}
      onClose={() => router.back()}
      token={token}
    />
  );
}
