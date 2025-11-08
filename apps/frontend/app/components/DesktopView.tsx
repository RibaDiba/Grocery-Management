"use client";
import React from 'react';
import { IPhoneMockup } from "react-device-mockup";

const DesktopView = () => {
  return (
    <div className="h-screen bg-gradient-to-br from-green-500 to-green-800 p-10 py-16 text-white overflow-hidden shadow-2xl flex items-center justify-center">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-10">
          {/* --- Content Column --- */}
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
            <h1 className="text-5xl font-bold mb-2">Grocery Management</h1>
            <p className="text-xl text-white/90 mb-6">Desktop View</p>
            <p className="text-lg text-white/80">Sign in on your mobile device or PWA to get started.</p>
          </div>

          {/* --- Mockup Column --- */}
          <div className="w-full lg:w-1/2 flex justify-center items-center">
            <div>
              <IPhoneMockup screenWidth={300}>
                <div className="w-full h-full bg-green-700">
                  {/* Content for the phone mockup */}
                </div>
              </IPhoneMockup>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopView;
