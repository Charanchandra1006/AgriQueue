import React from 'react';

const variantStyles = {
  primary: {
    background: 'linear-gradient(135deg, #606C38 0%, #4f5930 100%)',
    color: 'white',
    border: 'none',
    boxShadow: '0 2px 8px rgba(96, 108, 56, 0.28)',
  },
  secondary: {
    background: 'linear-gradient(135deg, #DDA15E 0%, #BC6C25 100%)',
    color: 'white',
    border: 'none',
    boxShadow: '0 2px 8px rgba(188, 108, 37, 0.28)',
  },
  copper: {
    background: 'linear-gradient(135deg, #BC6C25 0%, #96531c 100%)',
    color: 'white',
    border: 'none',
    boxShadow: '0 2px 8px rgba(150, 83, 28, 0.28)',
  },
  outline: {
    background: 'transparent',
    color: '#606C38',
    border: '1.5px solid #c3b98a',
    boxShadow: 'none',
  },
  ghost: {
    background: 'transparent',
    color: '#5c6245',
    border: 'none',
    boxShadow: 'none',
  },
  danger: {
    background: 'linear-gradient(135deg, #c0392b 0%, #a93226 100%)',
    color: 'white',
    border: 'none',
    boxShadow: '0 2px 8px rgba(192, 57, 43, 0.28)',
  },
};

const sizeStyles = {
  sm: { fontSize: '0.78rem', padding: '0.375rem 0.875rem', minHeight: '34px' },
  md: { fontSize: '0.875rem', padding: '0.6rem 1.25rem', minHeight: '44px' },
  lg: { fontSize: '0.95rem', padding: '0.75rem 1.5rem', minHeight: '50px' },
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  iconPosition = 'left',
  style: extraStyle = {},
  disabled,
  ...props
}) => {
  const varStyle = variantStyles[variant] || variantStyles.primary;
  const szStyle = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        borderRadius: '10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'all 0.18s ease',
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        pointerEvents: disabled ? 'none' : 'auto',
        ...varStyle,
        ...szStyle,
        ...extraStyle
      }}
      disabled={disabled}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.filter = 'brightness(0.92)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.filter = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      onMouseDown={e => { e.currentTarget.style.transform = 'translateY(0) scale(0.98)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
      className={className}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon style={{ marginRight: '6px', width: '16px', height: '16px', flexShrink: 0 }} />}
      {children}
      {Icon && iconPosition === 'right' && <Icon style={{ marginLeft: '6px', width: '16px', height: '16px', flexShrink: 0 }} />}
    </button>
  );
};
