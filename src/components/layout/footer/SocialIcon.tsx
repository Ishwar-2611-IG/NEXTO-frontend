
import type { ReactNode, SVGProps } from "react";
import type { SocialPlatform } from "./socialPlatforms";

interface SocialIconProps extends SVGProps<SVGSVGElement> {
  platform: SocialPlatform;
}

const ICON_PATHS = {
  facebook: (
    <path
      fill="currentColor"
      d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.3-1.5 1.6-1.5h1.7V3.7c-.8-.1-1.7-.2-2.6-.2-2.6 0-4.4 1.6-4.4 4.5v1.9H7v3.1h2.8v8h3.7Z"
    />
  ),
  instagram: (
    <>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="17.5" cy="6.7" r="1.1" fill="currentColor" />
    </>
  ),
  x: (
    <path
      fill="currentColor"
      d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.6 22H2.4l7.3-8.3L1.8 2h6.4l4.4 6.8L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.4L17.8 20Z"
    />
  ),
  linkedin: (
    <path
      fill="currentColor"
      d="M5.2 8.5A2.2 2.2 0 1 0 5.2 4a2.2 2.2 0 0 0 0 4.5ZM3.3 10h3.8v11H3.3zM9.4 10H13v1.5h.1a4 4 0 0 1 3.6-2c3.8 0 4.5 2.5 4.5 5.7V21h-3.8v-5.2c0-1.3 0-3-1.9-3s-2.2 1.4-2.2 2.9V21H9.4z"
    />
  ),
} satisfies Record<SocialPlatform, ReactNode>;

export function SocialIcon({ platform, ...props }: SocialIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {ICON_PATHS[platform]}
    </svg>
  );
}

export default SocialIcon;
