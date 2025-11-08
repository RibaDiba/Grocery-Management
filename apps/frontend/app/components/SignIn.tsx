import React from 'react';

const SignIn = ({ onSignIn }: { onSignIn: () => void }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-500 to-green-800 p-4 text-white">
      <div className="w-full max-w-xs text-center">
        <h1 className="mb-8 text-4xl font-bold">Sign In</h1>
        <div className="mb-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-full border border-solid border-white/[.2] bg-white/[.1] px-5 py-3 text-white placeholder-white/[.7] transition-colors focus:border-transparent focus:bg-white/[.2]"
          />
        </div>
        <div className="mb-6">
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-full border border-solid border-white/[.2] bg-white/[.1] px-5 py-3 text-white placeholder-white/[.7] transition-colors focus:border-transparent focus:bg-white/[.2]"
          />
        </div>
        <button
          onClick={onSignIn}
          className="w-full rounded-full bg-white px-5 py-3 font-medium text-green-700 transition-colors hover:bg-gray-200"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};

export default SignIn;
