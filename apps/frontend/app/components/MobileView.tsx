import React from 'react';

const MobileView = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-center p-8">
        <h1 className="text-5xl font-bold text-zinc-900 dark:text-zinc-50">Welcome!</h1>
        <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400">
          For the best experience, please install our app on your home screen.
        </p>
      </div>
    </div>
  );
};

export default MobileView;
