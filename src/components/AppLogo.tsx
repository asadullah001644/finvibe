import Image from "next/image";
import { APP_NAME, APP_TAGLINE_SHORT } from "@/lib/branding";

const SIZE_MAP = {
  sm: 32,
  md: 40,
  lg: 48,
} as const;

interface AppLogoProps {
  showText?: boolean;
  size?: keyof typeof SIZE_MAP;
  className?: string;
}

export default function AppLogo({
  showText = false,
  size = "md",
  className = "",
}: AppLogoProps) {
  const dimension = SIZE_MAP[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/icon.svg"
        alt=""
        width={dimension}
        height={dimension}
        className="shrink-0 rounded-xl"
        priority
      />
      {showText && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-[0.08em] text-zinc-100">
            {APP_NAME}
          </p>
          <p className="truncate text-[11px] uppercase tracking-[0.2em] text-zinc-500">
            {APP_TAGLINE_SHORT}
          </p>
        </div>
      )}
    </div>
  );
}
