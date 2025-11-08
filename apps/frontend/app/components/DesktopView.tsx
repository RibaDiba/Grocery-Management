import React from 'react';

const DesktopView = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-center p-8">
        <h1 className="text-5xl font-bold text-zinc-900 dark:text-zinc-50">Desktop Version</h1>
        <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400">
          This application is intended for mobile use. Please open it on your mobile device.
        </p>
      </div>
    </div>
  );
};

export default DesktopView;
