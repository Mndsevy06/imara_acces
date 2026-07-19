import React from 'react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Card({ children, className, animate = true, ...props }: CardProps) {
  const Component = animate ? motion.div : 'div';
  return (
    <Component
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      className={cn(
        "bg-bg-secondary rounded-2xl border border-border shadow-sm overflow-hidden",
        className
      )}
      {...(props as any)}
    >
      {children}
    </Component>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  loading?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon, 
  loading, 
  className, 
  ...props 
}: ButtonProps) {
  const variants = {
    primary: "bg-accent-primary text-white hover:bg-accent-hover shadow-md",
    secondary: "bg-bg-surface text-text-primary hover:bg-border",
    danger: "bg-danger text-white hover:opacity-90 shadow-md",
    ghost: "bg-transparent text-text-secondary hover:bg-bg-surface",
    outline: "bg-transparent border border-border text-text-primary hover:bg-bg-surface"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? <Icon size={18} /> : null}
      {children}
    </button>
  );
}

interface InputProps {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  className?: string;
  type?: string;
  placeholder?: string;
  defaultValue?: any;
  value?: any;
  onChange?: (e: any) => void;
  required?: boolean;
  disabled?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
}

export function Input({ label, icon: Icon, error, className, ...props }: InputProps) {
  const id = React.useId();
  return (
    <div className="space-y-1.5 w-full">
      {label && <label htmlFor={id} className="text-sm font-medium text-text-secondary ml-1">{label}</label>}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-primary transition-colors">
            <Icon size={18} />
          </div>
        )}
        <input
          id={id}
          className={cn(
            "w-full bg-bg-surface border-border border rounded-xl py-3 px-4 outline-none transition-all placeholder:text-text-muted focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/10 text-text-primary",
            Icon && "pl-11",
            error && "border-danger focus:border-danger focus:ring-danger/10",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger ml-1">{error}</p>}
    </div>
  );
}
