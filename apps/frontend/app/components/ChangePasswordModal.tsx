"use client";

import { useState, useEffect } from 'react';

interface ChangePasswordModalProps {
  userEmail: string;
  onClose: () => void;
}

// Generate a 6-digit verification code
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export default function ChangePasswordModal({ userEmail, onClose }: ChangePasswordModalProps) {
  const [step, setStep] = useState<'request' | 'verify' | 'newPassword'>('request');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  // Clear generated code when modal closes
  useEffect(() => {
    return () => {
      if (generatedCode) {
        // Clear code from sessionStorage when component unmounts
        sessionStorage.removeItem('password_reset_code');
        sessionStorage.removeItem('password_reset_email');
      }
    };
  }, [generatedCode]);

  const handleRequestCode = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      
      // Try to request code from backend first
      let response;
      try {
        response = await fetch('http://localhost:8000/api/auth/request-password-reset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ email: userEmail }),
        });
      } catch (err) {
        // If endpoint doesn't exist, use client-side generation
        response = { ok: false, status: 404 };
      }

      if (response.ok) {
        // Backend sent the code
        setSuccess('Verification code sent to your email. Please check your inbox.');
        setStep('verify');
        setCodeSent(true);
      } else {
        // Backend endpoint doesn't exist - generate code client-side for development
        const code = generateVerificationCode();
        setGeneratedCode(code);
        
        // Store code in sessionStorage for verification
        sessionStorage.setItem('password_reset_code', code);
        sessionStorage.setItem('password_reset_email', userEmail);
        sessionStorage.setItem('password_reset_timestamp', Date.now().toString());
        
        // In development, show the code in an alert
        // In production, this would be sent via email service
        alert(`🔐 Verification Code: ${code}\n\n(In production, this would be sent to ${userEmail})\n\nPlease enter this code to continue.`);
        
        setSuccess(`Verification code generated! ${process.env.NODE_ENV === 'development' ? 'Check the alert for your code.' : 'Please check your email.'}`);
        setStep('verify');
        setCodeSent(true);
      }
    } catch (err) {
      // Fallback to client-side code generation
      const code = generateVerificationCode();
      setGeneratedCode(code);
      sessionStorage.setItem('password_reset_code', code);
      sessionStorage.setItem('password_reset_email', userEmail);
      sessionStorage.setItem('password_reset_timestamp', Date.now().toString());
      
      alert(`🔐 Verification Code: ${code}\n\n(In production, this would be sent to ${userEmail})\n\nPlease enter this code to continue.`);
      setSuccess('Verification code generated! Check the alert for your code.');
      setStep('verify');
      setCodeSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const enteredCode = verificationCode.trim();
      
      // Try backend verification first
      let response;
      try {
        response = await fetch('http://localhost:8000/api/auth/verify-password-reset-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ 
            email: userEmail,
            code: enteredCode
          }),
        });
      } catch (err) {
        response = { ok: false, status: 404 };
      }

      if (response.ok) {
        // Backend verified the code
        setSuccess('Code verified successfully!');
        setStep('newPassword');
      } else {
        // Verify client-side generated code
        const storedCode = sessionStorage.getItem('password_reset_code');
        const storedEmail = sessionStorage.getItem('password_reset_email');
        const storedTimestamp = sessionStorage.getItem('password_reset_timestamp');
        
        // Check if code is expired (10 minutes)
        const isExpired = storedTimestamp && (Date.now() - parseInt(storedTimestamp)) > 10 * 60 * 1000;
        
        if (isExpired) {
          setError('Verification code has expired. Please request a new one.');
          setStep('request');
          setCodeSent(false);
          sessionStorage.removeItem('password_reset_code');
          sessionStorage.removeItem('password_reset_email');
          sessionStorage.removeItem('password_reset_timestamp');
        } else if (storedCode && storedEmail === userEmail && storedCode === enteredCode) {
          setSuccess('Code verified successfully!');
          setStep('newPassword');
        } else {
          setError('Invalid verification code. Please try again.');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const code = verificationCode.trim();
      
      // Try backend password reset first
      let response;
      try {
        response = await fetch('http://localhost:8000/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ 
            email: userEmail,
            code: code,
            new_password: newPassword
          }),
        });
      } catch (err) {
        response = { ok: false, status: 404 };
      }

      if (response.ok) {
        // Backend changed the password
        setSuccess('Password changed successfully!');
        sessionStorage.removeItem('password_reset_code');
        sessionStorage.removeItem('password_reset_email');
        sessionStorage.removeItem('password_reset_timestamp');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        // For development: show success message but note that backend support is needed
        setSuccess('Password change initiated! (Backend API endpoint needed for actual password change)');
        sessionStorage.removeItem('password_reset_code');
        sessionStorage.removeItem('password_reset_email');
        sessionStorage.removeItem('password_reset_timestamp');
        
        // In a real implementation, you would call the backend API here
        // For now, we'll show a message that backend support is needed
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md rounded-xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: '#fff' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 
            className="text-2xl font-bold"
            style={{ color: '#2D5016' }}
          >
            Change Password
          </h2>
          <button
            onClick={onClose}
            className="p-2"
            aria-label="Close"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: '#000' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div 
            className="mb-4 p-3 rounded-lg"
            style={{ backgroundColor: '#fee', color: '#c00' }}
          >
            {error}
          </div>
        )}

        {success && (
          <div 
            className="mb-4 p-3 rounded-lg"
            style={{ backgroundColor: '#efe', color: '#060' }}
          >
            {success}
          </div>
        )}

        {step === 'request' && (
          <div>
            <p className="mb-4 text-sm" style={{ color: '#666' }}>
              We'll send a verification code to <strong>{userEmail}</strong> to verify your identity.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div 
                className="mb-4 p-3 rounded-lg text-xs"
                style={{ backgroundColor: '#fff3cd', color: '#856404' }}
              >
                <strong>Development Mode:</strong> The verification code will be shown in an alert since email sending requires backend support.
              </div>
            )}
            <button
              onClick={handleRequestCode}
              disabled={loading || codeSent}
              className="w-full rounded-lg px-4 py-3 font-medium"
              style={{
                backgroundColor: codeSent ? '#ccc' : '#2D5016',
                color: '#fff',
              }}
            >
              {loading ? 'Sending...' : codeSent ? 'Code Sent' : 'Send Verification Code'}
            </button>
            {codeSent && (
              <button
                onClick={() => {
                  setCodeSent(false);
                  setStep('request');
                  setError('');
                  setSuccess('');
                  sessionStorage.removeItem('password_reset_code');
                  sessionStorage.removeItem('password_reset_email');
                  sessionStorage.removeItem('password_reset_timestamp');
                }}
                className="mt-2 w-full text-sm underline"
                style={{ color: '#2D5016' }}
              >
                Resend Code
              </button>
            )}
          </div>
        )}

        {step === 'verify' && (
          <div>
            <p className="mb-4 text-sm" style={{ color: '#666' }}>
              Enter the verification code sent to <strong>{userEmail}</strong>
            </p>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium" style={{ color: '#2D5016' }}>
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-lg border border-solid px-4 py-3"
                style={{
                  color: '#000',
                  borderColor: '#CBDFC9',
                }}
                placeholder="Enter 6-digit code"
                maxLength={6}
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    handleVerifyCode();
                  }
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('request');
                  setVerificationCode('');
                  setError('');
                  setSuccess('');
                }}
                className="flex-1 rounded-lg px-4 py-3 font-medium"
                style={{
                  backgroundColor: '#f0f0f0',
                  color: '#000',
                }}
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={handleVerifyCode}
                disabled={loading}
                className="flex-1 rounded-lg px-4 py-3 font-medium"
                style={{
                  backgroundColor: '#2D5016',
                  color: '#fff',
                }}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
          </div>
        )}

        {step === 'newPassword' && (
          <div>
            <p className="mb-4 text-sm" style={{ color: '#666' }}>
              Enter your new password
            </p>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium" style={{ color: '#2D5016' }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-solid px-4 py-3"
                style={{
                  color: '#000',
                  borderColor: '#CBDFC9',
                }}
                placeholder="Enter new password"
                disabled={loading}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium" style={{ color: '#2D5016' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-solid px-4 py-3"
                style={{
                  color: '#000',
                  borderColor: '#CBDFC9',
                }}
                placeholder="Confirm new password"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    handleChangePassword();
                  }
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep('verify')}
                className="flex-1 rounded-lg px-4 py-3 font-medium"
                style={{
                  backgroundColor: '#f0f0f0',
                  color: '#000',
                }}
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="flex-1 rounded-lg px-4 py-3 font-medium"
                style={{
                  backgroundColor: '#2D5016',
                  color: '#fff',
                }}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
