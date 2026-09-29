import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  iconPosition = 'left',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-xs focus:ring-primary-600',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white shadow-xs focus:ring-secondary-500',
    outline: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 focus:ring-slate-500',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-400',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500',
  };

  const sizes = {
    sm: 'text-sm px-3.5 py-1.5 min-h-[38px]',
    md: 'text-base px-5 py-2.5 min-h-[48px]', // Touch-friendly (at least 48px height)
    lg: 'text-lg px-7 py-3 min-h-[56px]',
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="mr-2 h-5 w-5" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="ml-2 h-5 w-5" />}
    </button>
  );
};
