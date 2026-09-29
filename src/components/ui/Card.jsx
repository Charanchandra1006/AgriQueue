import React from 'react';

export const Card = ({ children, className = '', style: extraStyle = {}, ...props }) => (
  <div
    style={{
      background: '#fffef8',
      border: '1.5px solid #e6dfc5',
      borderRadius: '16px',
      boxShadow: '0 2px 12px rgba(40, 54, 24, 0.07)',
      padding: '1.25rem',
      transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      ...extraStyle
    }}
    className={className}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div
    className={className}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1rem',
      paddingBottom: '0.75rem',
      borderBottom: '1.5px solid #e6dfc5',
    }}
  >
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3
    className={className}
    style={{
      fontFamily: 'var(--font-heading)',
      fontWeight: 600,
      fontSize: '1.05rem',
      color: '#283618',
      letterSpacing: '-0.01em',
      margin: 0,
    }}
  >
    {children}
  </h3>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);
