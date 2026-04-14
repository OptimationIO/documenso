import type { SVGAttributes } from 'react';

export type LogoProps = SVGAttributes<SVGSVGElement>;

export const BrandingLogoIcon = ({ ...props }: LogoProps) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" {...props}>
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
        fontSize="48"
        fontWeight="700"
        fill="currentColor"
      >
        A
      </text>
    </svg>
  );
};
