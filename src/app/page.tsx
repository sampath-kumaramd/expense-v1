'use client';

import { UserRegistrationForm } from '@/components/UserRegistrationForm';

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
    <main className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-center text-4xl font-bold">
          WhatsApp Expense Tracker
        </h1>

        <div className="mb-8 rounded-lg bg-blue-50 p-4 text-blue-800">
          <h2 className="mb-2 font-semibold">How it works:</h2>
          <ol className="list-inside list-decimal space-y-2">
            <li>Register with your WhatsApp name and Google Sheet URL</li>
            <li>
              Send expenses in the format:
              <code className="mx-2 rounded bg-blue-100 px-2 py-1">
                100, Food, Lunch at restaurant
              </code>
            </li>
            <li>Your expenses will be automatically logged in your sheet</li>
          </ol>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-2xl font-semibold">Register</h2>
          <UserRegistrationForm onSubmit={handleRegistration} />
        </div>
      </div>
    </main>
  );
}
