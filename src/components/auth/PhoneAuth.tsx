import { useEffect, useState, useRef } from 'react';

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
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Clean up reCAPTCHA on unmount
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const setupRecaptcha = () => {
    if (typeof window === 'undefined' || !auth) {
      console.error('Auth not initialized or not in browser environment');
      return null;
    }
    
    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: () => {
            // reCAPTCHA solved, enable the Send Code button if needed
          },
          'expired-callback': () => {
            // Reset the reCAPTCHA when it expires
            if (recaptchaVerifierRef.current) {
              recaptchaVerifierRef.current.clear();
              recaptchaVerifierRef.current = null;
            }
            toast.error('reCAPTCHA expired, please try again');
          }
        });
      }
      return recaptchaVerifierRef.current;
    } catch (error) {
      console.error('Error setting up reCAPTCHA:', error);
      toast.error('Error setting up authentication. Please refresh the page and try again.');
      return null;
    }
  };

  const handleSendCode = async () => {
    if (!auth) {
      toast.error('Authentication not initialized');
      return;
    }

    if (!phoneNumber) {
      toast.error('Please enter a phone number');
      return;
    }

    try {
      const recaptchaVerifier = setupRecaptcha();
      if (!recaptchaVerifier) {
        toast.error('Authentication setup failed');
        return;
      }

      // Ensure phone number is in international format
      const formattedPhone = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : phoneNumber.startsWith('0') 
          ? `+94${phoneNumber.slice(1)}` 
          : `+94${phoneNumber}`;

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifier
      );
      setVerificationId(confirmationResult.verificationId);
      setStep('otp');
      toast.success('Verification code sent successfully!');
    } catch (error) {
      console.error('Error sending verification code:', error);
      // Reset reCAPTCHA on error
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      toast.error('Error sending verification code. Please try again.');
    }
  };

  const handleVerifyCode = async () => {
    if (!auth) {
      toast.error('Authentication not initialized');
      return;
    }

    if (!verificationCode) {
      toast.error('Please enter the verification code');
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
      console.error('Error verifying code:', error);
      toast.error('Invalid verification code. Please try again.');
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
            <p className="text-xs text-gray-500">
              Enter your number with country code (e.g., +94XXXXXXXXX) or local format (e.g., 0XXXXXXXXX)
            </p>
          </div>
          <div id="recaptcha-container" className="flex justify-center"></div>
          <Button 
            onClick={handleSendCode} 
            className="w-full"
            disabled={!phoneNumber}
          >
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
          <Button 
            onClick={handleVerifyCode} 
            className="w-full"
            disabled={!verificationCode}
          >
            Verify Code
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setStep('phone');
              // Reset reCAPTCHA when going back
              if (recaptchaVerifierRef.current) {
                recaptchaVerifierRef.current.clear();
                recaptchaVerifierRef.current = null;
              }
            }}
            className="w-full"
          >
            Back
          </Button>
        </div>
      )}
    </div>
  );
} 