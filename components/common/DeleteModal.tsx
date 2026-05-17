'use client';
import { FiX, FiAlertTriangle } from 'react-icons/fi';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

export default function DeleteModal({ isOpen, onClose, onConfirm, itemName }: DeleteModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
          <FiAlertTriangle size={24} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete {itemName}?</h3>
        <p className="text-gray-500 text-sm mb-6">This action cannot be undone. The record will be permanently removed.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className="btn-primary bg-red-600 hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
}
