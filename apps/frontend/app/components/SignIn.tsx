import React, { useState } from 'react';

const SignIn = ({ onSignIn }: { onSignIn: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignInSubmit = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token); // Store the token
        onSignIn(); // Call the parent's onSignIn to change view or navigate
      } else {
        const errorData = await response.json();
        setError(typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData) || 'Login failed.');
      }
    } catch (err) { // eslint-disable-line @typescript-eslint/no-unused-vars
      setError('Network error or server is unreachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-xs text-center">
        <h1 className="mb-8 text-4xl font-bold">Sign In</h1>
        {error && <p className="text-red-300 mb-4">{error}</p>}
        <div className="mb-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border border-solid border-white/[.2] bg-white/[.1] px-5 py-3 text-white placeholder-white/[.7] transition-colors focus:border-transparent focus:bg-white/[.2]"
          />
        </div>
        <div className="mb-6">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full border border-solid border-white/[.2] bg-white/[.1] px-5 py-3 text-white placeholder-white/[.7] transition-colors focus:border-transparent focus:bg-white/[.2]"
          />
        </div>
        <button
          onClick={handleSignInSubmit}
          disabled={loading}
          className="w-full rounded-full bg-white px-5 py-3 font-medium text-green-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </div>
    </div>
  );
};

export default SignIn;
