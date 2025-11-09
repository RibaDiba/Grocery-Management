import React, { useState } from 'react';

// Helper function to decode JWT token and extract fields
const decodeJWT = (token: string): { userId: string | null; username: string | null } => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return { userId: payload.sub || null, username: payload.username || null };
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return { userId: null, username: null };
  }
};

const SignUp = ({ onSignUp }: { onSignUp: (accessToken: string, userId: string) => void }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUpSubmit = async () => {
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
  body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        // After successful registration, automatically log the user in
        try {
          const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            const token = loginData.access_token;
            
            // Decode JWT to get user_id
            const { userId, username: claimedUsername } = decodeJWT(token);
            
            // Store token, user_id, and email in localStorage for persistence
            localStorage.setItem('access_token', token);
            if (userId) localStorage.setItem('user_id', userId);
            if (claimedUsername) localStorage.setItem('username', claimedUsername);
            // Store email for profile display
            localStorage.setItem('user_email', email);
            
            onSignUp(token, userId || ''); // Consumer currently expects userId
          } else {
            // Registration successful but auto-login failed, just proceed
            onSignUp('', '');
          }
        } catch (err) { // eslint-disable-line @typescript-eslint/no-unused-vars
          // Auto-login failed, but registration was successful
          onSignUp('', '');
        }
      } else {
        const errorData = await response.json();
        const errorDetail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData) || 'Registration failed.';
        
        // Check if email already exists and show helpful message
        if (errorDetail.toLowerCase().includes('email already registered') || errorDetail.toLowerCase().includes('email already')) {
          setError('This email is already registered. Please sign in instead.');
        } else {
          setError(errorDetail);
        }
      }
    } catch (err) { // eslint-disable-line @typescript-eslint/no-unused-vars
      setError('Network error or server is unreachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xs text-center">
        <h1 className="mb-8 text-4xl font-bold" style={{ color: '#354A33' }}>
          Sign up
        </h1>
        {error && <p className="mb-4 text-red-600">{error}</p>}
        <div className="mb-4">
          <label className="block mb-2 text-left text-sm font-medium" style={{ color: '#354A33' }}>
            Username
          </label>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-full border border-solid bg-white px-5 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={{
              color: '#354A33',
              borderColor: '#CBDFC9',
              borderRadius: '9999px'
            }}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-left text-sm font-medium" style={{ color: '#354A33' }}>
            Email
          </label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border border-solid bg-white px-5 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={{
              color: '#354A33',
              borderColor: '#CBDFC9',
              borderRadius: '9999px'
            }}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-left text-sm font-medium" style={{ color: '#354A33' }}>
            Password
          </label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full border border-solid bg-white px-5 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={{
              color: '#354A33',
              borderColor: '#CBDFC9',
              borderRadius: '9999px'
            }}
          />
        </div>
        <div className="mb-6">
          <label className="block mb-2 text-left text-sm font-medium" style={{ color: '#354A33' }}>
            Confirm Password
          </label>
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-full border border-solid bg-white px-5 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={{
              color: '#354A33',
              borderColor: '#CBDFC9',
              borderRadius: '9999px'
            }}
          />
        </div>
        <button
          onClick={handleSignUpSubmit}
          disabled={loading}
          className="w-full rounded-full px-5 py-3 font-medium transition-colors hover:opacity-90 disabled:opacity-50"
          style={{
            backgroundColor: '#354A33',
            color: '#FFFFFF',
            borderRadius: '9999px'
          }}
        >
          {loading ? 'Signing Up...' : 'Sign up'}
        </button>
      </div>
    </div>
  );
};

export default SignUp;
