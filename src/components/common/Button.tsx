import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-[10px] gap-1.5 font-medium',
    md: 'text-sm px-4 py-2.5 rounded-[12px] gap-2 font-medium',
    lg: 'text-base px-6 py-3 rounded-[14px] gap-2.5 font-semibold'
  };

  const variantStyles = {
    primary: 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED] shadow-sm hover:shadow-[#8B5CF6]/20',
    secondary: 'bg-[#18181D] text-[#F4F1EA] hover:bg-[#27272D] border border-[#27272D]',
    ghost: 'bg-transparent text-[#9A9AA3] hover:text-[#F4F1EA] hover:bg-[#18181D]',
    outline: 'bg-transparent text-[#F4F1EA] border border-[#27272D] hover:border-[#8B5CF6]/50 hover:bg-[#18181D]',
    danger: 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/25'
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
