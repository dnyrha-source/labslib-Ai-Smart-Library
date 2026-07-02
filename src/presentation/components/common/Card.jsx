import React from 'react';
import './Card.css';

const Card = ({
  children,
  className = '',
  hoverable = false,
  glowColor = 'none', // 'cyan' | 'purple' | 'none'
  onClick,
  ...props
}) => {
  const isClickable = !!onClick;
  
  return (
    <div
      onClick={onClick}
      className={`card-panel glass-panel ${hoverable ? 'card-hoverable' : ''} ${isClickable ? 'card-clickable' : ''} card-glow-${glowColor} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
