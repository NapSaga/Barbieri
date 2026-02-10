import { cn } from "@/lib/utils";

interface LogoIconProps {
  className?: string;
  size?: number;
}

export function LogoIcon({ className, size = 32 }: LogoIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-label="BarberOS"
    >
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
        <clipPath id="logo-clip">
          <rect width="32" height="32" rx="7" />
        </clipPath>
      </defs>
      <rect width="32" height="32" rx="7" fill="url(#logo-bg)" />
      <g clipPath="url(#logo-clip)" opacity="0.12" fill="white">
        <rect x="-6" y="3" width="44" height="3" rx="1.5" transform="rotate(-45 16 16)" />
        <rect x="-6" y="11" width="44" height="3" rx="1.5" transform="rotate(-45 16 16)" />
        <rect x="-6" y="19" width="44" height="3" rx="1.5" transform="rotate(-45 16 16)" />
        <rect x="-6" y="27" width="44" height="3" rx="1.5" transform="rotate(-45 16 16)" />
      </g>
      <path
        d="M10.5 7.5h6c1.9 0 3.4.5 4.3 1.5.9.9 1.3 2.1 1.3 3.4 0 1-.3 1.9-.8 2.6-.5.6-1.2 1.1-2.1 1.3v.1c1.2.2 2.1.8 2.8 1.6.6.8 1 1.8 1 3 0 1.6-.6 2.9-1.7 3.8-1.1.9-2.6 1.4-4.5 1.4H10.5V7.5zm3 7.5h3.2c.9 0 1.6-.2 2.1-.7.5-.4.7-1 .7-1.8 0-.7-.2-1.3-.7-1.7-.5-.4-1.2-.6-2.1-.6h-3.2V15zm0 2.3v5.5h3.5c1 0 1.7-.2 2.3-.7.5-.5.8-1.2.8-2.1 0-.9-.3-1.5-.8-2-.6-.5-1.4-.7-2.4-.7h-3.4z"
        fill="white"
      />
    </svg>
  );
}

interface LogoFullProps {
  className?: string;
  iconSize?: number;
}

/** Combined logo: icon + wordmark as a single inline element */
export function LogoFull({ className, iconSize = 34 }: LogoFullProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoIcon size={iconSize} />
      <span className="text-[1.15rem] font-extrabold tracking-tight leading-none">
        <span className="text-sidebar-foreground/60">Barber</span>
        <span className="text-sidebar-foreground">OS</span>
      </span>
    </div>
  );
}
