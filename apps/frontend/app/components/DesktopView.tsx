"use client";
import React, { useState } from 'react';
import { IPhoneMockup } from "react-device-mockup";
import SignIn from './SignIn';
import SignUp from './SignUp';

const DesktopView = () => {
  const [showSignIn, setShowSignIn] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  const handleSignIn = () => {
    setSignedIn(true);
  };

  const handleSignUp = () => {
    setSignedIn(true);
  };

  if (!signedIn) {
    return (
      <div className="h-screen bg-gradient-to-br from-green-500 to-green-800 p-10 py-16 text-white overflow-hidden shadow-2xl flex items-center justify-center">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            {/* --- Auth Column --- */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
              {showSignIn ? (
                <SignIn onSignIn={handleSignIn} />
              ) : (
                <SignUp onSignUp={handleSignUp} />
              )}
              <button
                onClick={() => setShowSignIn(!showSignIn)}
                className="mt-4 text-white underline"
              >
                {showSignIn ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>

            {/* --- Mockup Column --- */}
            <div className="w-full lg:w-1/2 flex justify-center items-center">
              <div>
                <IPhoneMockup screenWidth={300}>
                  <div className="w-full h-full bg-green-700">
                    {/* Content for the phone mockup when not signed in */}
                  </div>
                </IPhoneMockup>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-green-500 to-green-800 p-10 py-16 text-white overflow-hidden shadow-2xl flex items-center justify-center">
      <div className="container mx-auto">
        <h1 className="text-5xl font-bold mb-2">Welcome!</h1>
        <p className="text-xl text-white/90 mb-6">You are now signed in to the Desktop View.</p>
        {/* Here you would render the actual desktop content after sign-in */}
      </div>
    </div>
  );
};

export default DesktopView;
