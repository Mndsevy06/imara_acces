import { useEffect } from 'react';
import { useThemeStore } from '../store/useStore';
import { Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { isDarkMode, toggleTheme } = useThemeStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "p-2 rounded-xl bg-bg-surface text-text-secondary hover:text-accent-primary transition-all active:scale-90",
        className
      )}
    >
      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

export function PexelsImage({ 
  query, 
  className,
  alt = "Background"
}: { 
  query: string; 
  className?: string;
  alt?: string;
}) {
  // Mocking Pexels URL but in real app would use VITE_PEXELS_API_KEY
  // For demo purposes, we use a constant high-quality image URL based on common pexels patterns
  const images: Record<string, string> = {
    'campus': 'https://picsum.photos/seed/campus/1260/750',
    'parking': 'https://picsum.photos/seed/parking/1260/750',
    'security': 'https://picsum.photos/seed/security/1260/750',
    'car': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1260&auto=format&fit=crop'
  };

  const src = images[query] || images['campus'];

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-transparent" />
    </div>
  );
}
