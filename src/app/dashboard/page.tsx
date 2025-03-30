'use client';

import { useState, useEffect } from 'react';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

import { Navbar } from '@/components/Navbar';
import { UserInfoDialog } from '@/components/UserInfoDialog';

interface Expense {
  id: string;
  createdAt: string;
  amount: number;
  category: string;
  note: string | null;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }

    const fetchExpenses = async () => {
      try {
        const response = await fetch('/api/expenses');
        if (!response.ok) {
          throw new Error('Failed to fetch expenses');
        }
        const data = await response.json();
        setExpenses(data);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchExpenses();
    }
  }, [user, isLoaded, router]);

  if (!isLoaded || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto p-4">
        <UserInfoDialog />
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-3xl font-bold">Your Expenses</h1>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Amount
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Note
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      {new Date(expense.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      ${expense.amount.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {expense.category}
                    </td>
                    <td className="px-6 py-4">{expense.note || '-'}</td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No expenses recorded yet. Send a message via WhatsApp to
                      add one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
