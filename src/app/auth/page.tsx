'use client';

import { PhoneAuth } from '@/components/auth/PhoneAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
          <PhoneAuth />
        </CardContent>
      </Card>
    </div>
  );
} 