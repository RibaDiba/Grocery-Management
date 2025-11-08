import React, { useState } from 'react';

const SignUp = ({ onSignUp }: { onSignUp: () => void }) => {
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
    if (!email || !password || !confirmPassword) {
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
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // Registration successful
        onSignUp(); // Call the parent's onSignUp to change view or navigate
      } else {
        const errorData = await response.json();
        setError(typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData) || 'Registration failed.');
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
        <h1 className="mb-8 text-4xl font-bold">Sign Up</h1>
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
        <div className="mb-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full border border-solid border-white/[.2] bg-white/[.1] px-5 py-3 text-white placeholder-white/[.7] transition-colors focus:border-transparent focus:bg-white/[.2]"
          />
        </div>
        <div className="mb-6">
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-full border border-solid border-white/[.2] bg-white/[.1] px-5 py-3 text-white placeholder-white/[.7] transition-colors focus:border-transparent focus:bg-white/[.2]"
          />
        </div>
        <button
          onClick={handleSignUpSubmit}
          disabled={loading}
          className="w-full rounded-full bg-white px-5 py-3 font-medium text-green-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </div>
    </div>
  );
};

export default SignUp;
