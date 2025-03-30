import { useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function UserInfoDialog() {
  const { user } = useUser();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sheetLink, setSheetLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Update user metadata using Clerk
      await user?.update({
        unsafeMetadata: {
          phoneNumber,
          sheetLink,
          hasCompletedOnboarding: true,
        },
      });

      // Save user data to database
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whatsappName: phoneNumber,
          sheetUrl: sheetLink,
          email: user?.primaryEmailAddress?.emailAddress,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register user');
      }

      // Redirect to the main app
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating user info:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={!user?.unsafeMetadata?.hasCompletedOnboarding}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Please provide your contact information to continue.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phoneNumber">WhatsApp Number</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              placeholder="Enter your WhatsApp number"
            />
          </div>

          <div>
            <Label htmlFor="sheetLink">Google Sheet URL</Label>
            <Input
              id="sheetLink"
              value={sheetLink}
              onChange={(e) => setSheetLink(e.target.value)}
              required
              placeholder="Enter your Google Sheet URL"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save and Continue'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
