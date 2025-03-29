'use client';

import { Suspense } from 'react';

import { PhoneAuth } from '@/components/auth/PhoneAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your Sri Lankan phone number to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoadingSpinner />}>
            <PhoneAuth />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
} 