import { useState } from 'react';

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

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => {
          // reCAPTCHA solved
        },
      });
    }
  };

  const handleSendCode = async () => {
    try {
      setupRecaptcha();
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+94${phoneNumber}`;
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        (window as any).recaptchaVerifier
      );
      setVerificationId(confirmationResult.verificationId);
      setStep('otp');
      toast.success('Verification code sent successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Error sending verification code');
    }
  };

  const handleVerifyCode = async () => {
    try {
      const credential = await signInWithCredential(
        auth,
        PhoneAuthProvider.credential(verificationId, verificationCode)
      );
      toast.success('Phone number verified successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Invalid verification code');
    }
  };

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