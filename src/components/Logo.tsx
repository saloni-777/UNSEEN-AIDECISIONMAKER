import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = {
    sm: { icon: 18, text: 'text-base' },
    md: { icon: 22, text: 'text-lg' },
    lg: { icon: 28, text: 'text-2xl' },
  };
  const d = dims[size];

  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group">
      <div className="relative flex items-center justify-center">
        <Eye size={d.icon} className="text-[#f4f4f5] transition-transform duration-300 group-hover:scale-105" strokeWidth={1.5} />
        <div className="absolute inset-0 bg-[#7dd3fc]/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <span className={`font-semibold tracking-tight text-[#f4f4f5] ${d.text}`}>
        UNSEEN
      </span>
    </Link>
  );
}
