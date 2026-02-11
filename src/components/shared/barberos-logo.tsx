import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoIconProps {
  className?: string;
  size?: number;
}

export function LogoIcon({ className, size = 32 }: LogoIconProps) {
  return (
    <Image
      src="/logo.png"
      alt="BarberOS"
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

interface LogoFullProps {
  className?: string;
  iconSize?: number;
}

/** Combined logo: full wordmark image */
export function LogoFull({ className, iconSize = 34 }: LogoFullProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/logo.png"
        alt="BarberOS"
        width={Math.round(iconSize * 4)}
        height={iconSize}
        className="shrink-0 object-contain"
      />
    </div>
  );
}
