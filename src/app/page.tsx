'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { UserRegistrationForm } from '@/components/UserRegistrationForm';
import { useAuth } from '@/lib/AuthContext';

export default function Home() {
  const handleRegistration = async (data: {
    whatsappName: string;
    sheetUrl: string;
  }) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      // Handle successful registration
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Registration error:', error);
      // Handle error (show toast notification, etc.)
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container flex h-16 items-center px-4">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block">
                Expense Tracker
              </span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <Link href="/auth">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container px-4 py-16">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Track Your Expenses
          </h1>
          <p className="mt-4 max-w-[700px] text-gray-500 md:text-xl">
            Easily manage and track your expenses by linking your Excel sheets.
            Get insights into your spending patterns and take control of your finances.
          </p>
          <div className="mt-8">
            <Link href="/auth">
              <Button size="lg">Get Started</Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border p-6">
            <h3 className="text-xl font-bold">Phone Authentication</h3>
            <p className="mt-2 text-gray-500">
              Secure sign-in with your Sri Lankan phone number using SMS verification.
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="text-xl font-bold">Excel Integration</h3>
            <p className="mt-2 text-gray-500">
              Link your Excel sheets and automatically import your expense data.
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="text-xl font-bold">Personal Dashboard</h3>
            <p className="mt-2 text-gray-500">
              View and analyze your expenses with detailed insights and reports.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
