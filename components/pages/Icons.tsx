import React from 'react';

interface IconProps {
  className?: string;
  width?: number;
  height?: number;
}

export const PaperPlaneIcon: React.FC<IconProps> = ({ className = "text-gray-400 dark:text-gray-600", width = 60, height = 60 }) => (
  <svg width={width} height={height} viewBox="0 0 60 60" fill="none" className={className}>
    <path 
      d="M10 30L45 15L35 40L25 35L10 30Z M35 40L45 15M25 35L35 25" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ShoppingBagIcon: React.FC<IconProps> = ({ className = "text-gray-400 dark:text-gray-600", width = 50, height = 50 }) => (
  <svg width={width} height={height} viewBox="0 0 50 50" fill="none" className={className}>
    <path 
      d="M10 15L40 15L38 40L12 40L10 15Z M15 15V10C15 7 17 5 20 5L30 5C33 5 35 7 35 10V15M20 25V30M30 25V30" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const PackageIcon: React.FC<IconProps> = ({ className = "text-gray-400 dark:text-gray-600", width = 45, height = 45 }) => (
  <svg width={width} height={height} viewBox="0 0 45 45" fill="none" className={className}>
    <path 
      d="M5 12L22.5 5L40 12L22.5 19L5 12Z M5 12V30L22.5 37M40 12V30L22.5 37M22.5 19V37" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const HandshakeIcon: React.FC<IconProps> = ({ className = "text-gray-400 dark:text-gray-600", width = 55, height = 55 }) => (
  <svg width={width} height={height} viewBox="0 0 55 55" fill="none" className={className}>
    <path 
      d="M15 25L25 15L35 25M25 15V35M10 20C10 15 15 10 20 10M45 20C45 15 40 10 35 10M20 40L35 40" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const AtomIcon: React.FC<IconProps> = ({ className = "text-gray-400 dark:text-gray-600", width = 40, height = 40 }) => (
  <svg width={width} height={height} viewBox="0 0 40 40" fill="none" className={className}>
    <circle cx="20" cy="20" r="3" fill="currentColor"/>
    <ellipse cx="20" cy="20" rx="15" ry="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <ellipse cx="20" cy="20" rx="15" ry="6" stroke="currentColor" strokeWidth="1.5" fill="none" transform="rotate(60 20 20)"/>
    <ellipse cx="20" cy="20" rx="15" ry="6" stroke="currentColor" strokeWidth="1.5" fill="none" transform="rotate(120 20 20)"/>
  </svg>
);
