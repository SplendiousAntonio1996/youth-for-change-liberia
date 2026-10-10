import React from 'react';
import { YOC_LOGO_SRC } from '../data/assets';

interface YocLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  alt?: string;
}

export const YocLogo: React.FC<YocLogoProps> = ({
  className = '',
  size = 'md',
  alt = 'Youth For Change Liberia Official Logo'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-full h-full max-w-full max-h-full',
    lg: 'w-full h-full max-w-full max-h-full',
    xl: 'w-full h-full max-w-full max-h-full',
    custom: ''
  }[size];

  return (
    <img
      src={YOC_LOGO_SRC}
      alt={alt}
      className={`block object-contain ${sizeClasses} ${className}`.trim()}
    />
  );
};

