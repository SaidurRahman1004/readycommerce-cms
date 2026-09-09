import { AlertCircle } from 'lucide-react';

interface FormErrorProps {
  message?: string;
  className?: string;
}

export function FormError({ message, className = '' }: FormErrorProps) {
  if (!message) return null;

  return (
    <div className={`mt-1.5 flex items-start gap-1.5 text-sm text-rose-500 font-medium ${className}`}>
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <span className="leading-tight">{message}</span>
    </div>
  );
}
