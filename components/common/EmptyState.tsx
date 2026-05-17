'use client';

interface EmptyStateProps {
  title: string;
  message: string;
  action?: () => void;
}

export default function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="text-gray-500 mt-1">{message}</p>
      {action && (
        <button onClick={action} className="mt-4 btn-primary">
          Try Again
        </button>
      )}
    </div>
  );
}
