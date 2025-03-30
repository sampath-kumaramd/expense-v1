'use client';

import { useEffect } from "react";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      router.push("/dashboard");
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
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to Expense Tracker</h1>
      <div className="flex gap-4">
        <a
          href="/sign-in"
          className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Sign In
        </a>
        <a
          href="/sign-up"
          className="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        >
          Sign Up
        </a>
      </div>
    </main>
  );
}
