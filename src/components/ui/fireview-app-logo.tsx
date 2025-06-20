// src/components/ui/fireview-app-logo.tsx
import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export const FireViewAppLogo = ({
  className,
  ...rest
}: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 160 34" // Defines the coordinate system for the SVG
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="FireView Logo"
    // The className (e.g., "h-8 w-auto") will be passed from where it's used
    // It will control the display size of the SVG
    className={cn(className)}
    {...rest}
  >
    {/* Flame Icon - This is a stylized representation based on your logo */}
    <path
      d="M20.82,6.1C19.36,8.19,18.63,10.66,18.63,13.01C18.63,17.51,20.67,21.51,23.7,24.2C24.36,24.8,25.08,25.33,25.85,25.83V26.03C24.28,28.04,22.17,29.55,19.64,30.31C16.13,31.35,12.38,31.2,9.52,29.52C9.31,29.39,9.1,29.24,8.9,29.07C8.7,28.9,8.52,28.72,8.35,28.51C8.18,28.3,8.03,28.07,7.88,27.82C7.74,27.58,7.62,27.32,7.5,27.05C6.75,25.66,6.4,24.09,6.49,22.52C6.59,20.94,7.14,19.38,8.08,18.03C8.62,17.24,9.28,16.51,10.05,15.86C11.72,14.41,13.36,12.89,14.64,10.99C16.06,8.86,16.91,6.33,17.49,3.8C17.57,3.51,17.65,3.22,17.74,2.93H17.81C17.93,2.75,18.06,2.57,18.19,2.39H18.28C19.49,3.21,20.53,4.25,21.29,5.61L20.82,6.1ZM21.6701 1.61C21.3101 1.18 20.9101 0.790001 20.4901 0.430001C19.03,1.72 18.06,3.38 17.67,5.17C17.31,6.81 17.47,8.5 18.08,10.09C18.58,11.36 19.4,12.51 20.49,13.4C21.46,14.19 22.28,15.16 22.72,16.29C23.02,15.51 23.13,14.7 23.13,13.87C23.13,12.44 22.74,11.03 22.03,9.77C21.24,8.36 20.07,7.21 18.63,6.47C17.58,5.92 16.43,5.73 15.31,5.93C14.25,6.12 13.27,6.69 12.52,7.55C12.2,7.91 11.92,8.3 11.68,8.71C13.22,10.38 14.06,12.54 14.06,14.78C14.06,15.48 13.94,16.18 13.72,16.84C11.55,16.13 9.77005,14.54 8.76005,12.38C7.61005,9.86 7.40005,6.96 8.26005,4.28C8.80005,2.53 9.86005,1.01 11.29,0H11.31C10.9821 0.441059 10.7033 0.927699 10.48 1.44C9.03005,4.64 9.03005,8.23 10.48,11.44C11.35,13.29 12.76,14.86 14.51,15.91C16.36,17.02 18.49,17.56 20.67,17.42C21.26,16.26 21.65,15.03 21.81,13.79C21.94,12.38 21.89,10.96 21.89,9.54V7.01C21.89,5.040001 21.89,3.28 21.6701,1.61Z"
      fill="hsl(16, 100%, 60%)" // Orange color for the flame
    />
    {/* Text "fireView" */}
    <text
      x="38" // Positioned to the right of the flame
      y="23" // Vertically centered (approx)
      fontFamily="Space Grotesk, sans-serif" // Matches existing headline font
      fontSize="22" // Font size for the text
      fill="hsl(var(--sidebar-primary-foreground))" // Uses theme variable for text color
      className="group-data-[collapsible=icon]/sidebar-wrapper:hidden" // Tailwind class to hide text when sidebar is collapsed
    >
      <tspan fontWeight="500">fire</tspan>
      <tspan fontWeight="700">View</tspan>
    </text>
  </svg>
);
