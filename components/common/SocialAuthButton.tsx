'use client';
import { FcGoogle } from 'react-icons/fc';

interface SocialAuthButtonProps {
  onClick: () => void;
  label?: string;
}

export default function SocialAuthButton({ onClick, label = "Continue with Google" }: SocialAuthButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 transition"
    >
      <FcGoogle className="text-xl" />
      {label}
    </button>
  );
}
