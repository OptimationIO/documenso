import type { SVGAttributes } from 'react';

export type LogoProps = SVGAttributes<SVGSVGElement>;

export const BrandingLogo = ({ ...props }: LogoProps) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 60" {...props}>
      <text
        x="0"
        y="46"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
        fontSize="48"
        fontWeight="700"
        fill="currentColor"
        letterSpacing="-1"
      >
        Aplyio
      </text>
    </svg>
  );
};
