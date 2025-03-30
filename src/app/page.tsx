'use client';

import { useEffect } from 'react';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      router.push('/dashboard');
    }
  }, [user, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to Expense Tracker
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl">
            Track your expenses easily and sync them with Google Sheets
          </p>
          <div className="flex gap-4">
            <a
              href="/sign-in"
              className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
            >
              Sign In
            </a>
            <a
              href="/sign-up"
              className="rounded-md bg-white px-6 py-3 text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
