import { useEffect, useState } from 'react';

import { PhoneAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, signInWithCredential } from 'firebase/auth';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';

import { Input } from '../ui/input';
import { Label } from '../ui/label';

export function PhoneAuth() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const setupRecaptcha = () => {
    if (typeof window === 'undefined' || !auth) return null;
    
    if (!(window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: () => {
            // reCAPTCHA solved
          },
        });
      } catch (error) {
        console.error('Error setting up reCAPTCHA:', error);
        toast.error('Error setting up authentication');
        return null;
      }
    }
    return (window as any).recaptchaVerifier;
  };

  const handleSendCode = async () => {
    if (!auth) {
      toast.error('Authentication not initialized');
      return;
    }

    try {
      const recaptchaVerifier = setupRecaptcha();
      if (!recaptchaVerifier) {
        toast.error('Authentication setup failed');
        return;
      }

      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+94${phoneNumber}`;
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifier
      );
      setVerificationId(confirmationResult.verificationId);
      setStep('otp');
      toast.success('Verification code sent successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Error sending verification code');
      // Reset reCAPTCHA on error
      (window as any).recaptchaVerifier = null;
    }
  };

  const handleVerifyCode = async () => {
    if (!auth) {
      toast.error('Authentication not initialized');
      return;
    }

    try {
      const credential = await signInWithCredential(
        auth,
        PhoneAuthProvider.credential(verificationId, verificationCode)
      );
      toast.success('Phone number verified successfully!');
      // Redirect to dashboard or home page after successful verification
      window.location.href = '/dashboard';
    } catch (error) {
      console.error(error);
      toast.error('Invalid verification code');
    }
  };

  if (!isClient) {
    return null; // or a loading spinner
  }

  return (
    <div className="space-y-4">
      {step === 'phone' ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+94XXXXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div id="recaptcha-container"></div>
          <Button onClick={handleSendCode} className="w-full">
            Send Verification Code
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
          </div>
          <Button onClick={handleVerifyCode} className="w-full">
            Verify Code
          </Button>
          <Button
            variant="outline"
            onClick={() => setStep('phone')}
            className="w-full"
          >
            Back
          </Button>
        </div>
      )}
    </div>
  );
} 