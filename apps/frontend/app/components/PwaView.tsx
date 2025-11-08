"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SignIn from './SignIn';
import SignUp from './SignUp';
import ReceiptsList from './ReceiptsList';

interface GroceryItem {
  id: number;
  name: string;
  completed: boolean;
}

export default function PwaView() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [showSignIn, setShowSignIn] = useState(true); // New state to toggle between SignIn and SignUp

  const handleAddItem = () => {
    if (newItem.trim() !== '') {
      setItems([...items, { id: Date.now(), name: newItem, completed: false }]);
      setNewItem('');
    }
  };

  const handleToggleItem = (id: number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleRemoveItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleSignIn = () => {
    setSignedIn(true);
  };

  const handleSignUp = () => {
    setSignedIn(true);
  };

  if (!signedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-500 to-green-800 p-4 text-white">
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
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center bg-white py-12 px-8 dark:bg-black sm:items-start">
        <header className="w-full">
          <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Grocery List
          </h1>
        </header>

        <div className="mt-8 w-full">
          <div className="flex gap-4">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add a new item"
              className="flex-grow rounded-full border border-solid border-black/[.08] px-5 py-3 text-black transition-colors focus:border-transparent focus:bg-black/[.04] dark:border-white/[.145] dark:bg-black dark:text-white dark:focus:bg-[#1a1a1a]"
            />
            <button
              onClick={handleAddItem}
              className="rounded-full bg-foreground px-5 py-3 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Add
            </button>
          </div>
        </div>

        <ul className="mt-8 w-full space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900"
              >
                <span
                  className={`text-lg ${
                    item.completed ? 'text-zinc-500 line-through dark:text-zinc-400' : 'text-black dark:text-zinc-50'
                  }`}
                  onClick={() => handleToggleItem(item.id)}
                >
                  {item.name}
                </span>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <ReceiptsList />
      </main>
    </div>
  );
}