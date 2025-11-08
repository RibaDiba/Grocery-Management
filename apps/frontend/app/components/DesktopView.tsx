"use client";
import React from 'react';
import { IPhoneMockup } from "react-device-mockup";
import { motion } from 'framer-motion';

const DesktopView = () => {
  return (
    <div className="h-screen bg-gradient-to-br from-green-500 to-green-800 p-10 py-16 text-white overflow-hidden shadow-2xl flex items-center justify-center">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-10">
          
          {/* --- Text Column --- */}
          <div className="w-full lg:w-1/2">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl font-bold mb-2"
            >
              Grocery Management
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-white/90 mb-6"
            >
              View and install this app on your phone!
            </motion.p>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-2xl font-semibold mt-6 mb-3"
            >
              Your Smart Grocery Companion
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-lg leading-relaxed text-white/90 max-w-lg mb-4"
            >
              Shop smarter and waste less. Our app is your personal companion for
              sustainable shopping.
            </motion.p>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="text-lg leading-relaxed text-white/90 max-w-lg"
            >
              Simply scan your receipts or snap a photo of your groceries. Our AI
              instantly builds a smart digital pantry for you, estimates
              expiration dates, and sends timely reminders before your food goes
              bad.
            </motion.p>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="text-2xl font-semibold mt-6 mb-3"
            >
              Stuck on what to make for dinner?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="text-lg leading-relaxed text-white/90 max-w-lg"
            >
              We'll even generate creative recipes based on the ingredients you
              already have. From the store aisle to your kitchen, we help you use
              everything you buy.
            </motion.p>
          </div>

          {/* --- Mockup Column --- */}
          <div className="w-full lg:w-1/2 flex justify-center items-center">
            <div>
              <IPhoneMockup screenWidth={300}>
                <div className="w-full h-full bg-green-700">
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
