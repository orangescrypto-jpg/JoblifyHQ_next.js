'use client';
import type { InputHTMLAttributes, ChangeEvent } from 'react';


interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
}

export default function FormInput({ label, type = "text", value, onChange, error, placeholder, ...props }: FormInputProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input-field ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
