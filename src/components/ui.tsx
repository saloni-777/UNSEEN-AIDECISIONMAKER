import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center gap-4">
      <Loader2 size={24} className="text-[#7dd3fc] animate-spin" />
      <p className="text-sm text-[#a1a1aa]">{message || 'Loading...'}</p>
    </div>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin" />;
}

export function ButtonSpinner() {
  return <Loader2 size={16} className="animate-spin" />;
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-[#fca5a5]/20 bg-[#fca5a5]/5">
      <p className="text-sm text-[#fca5a5] flex-1">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm text-[#fca5a5] underline hover:no-underline shrink-0">
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon && <div className="text-[#52525b]">{icon}</div>}
      <h3 className="text-base font-medium text-[#f4f4f5]">{title}</h3>
      {description && <p className="text-sm text-[#a1a1aa] max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
