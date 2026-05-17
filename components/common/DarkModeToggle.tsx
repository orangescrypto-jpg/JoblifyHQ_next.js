'use client';
import { useState, useEffect } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';

export default function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    setDark(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <button 
      onClick={toggle} 
      aria-label="Toggle dark mode"
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
    >
      {dark ? <FiSun className="text-yellow-400" /> : <FiMoon className="text-gray-600 dark:text-gray-300" />}
    </button>
  );
}
