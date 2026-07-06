"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, type MotionProps } from "framer-motion";
import { X } from "lucide-react";

/** Matches the app's primary desktop breakpoint (lg). */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

export function getModalMotionProps(isDesktop: boolean): Pick<
  MotionProps,
  "initial" | "animate" | "exit" | "transition"
> {
  return {
    initial: isDesktop
      ? { opacity: 0, scale: 0.95, y: 16 }
      : { opacity: 0, y: "100%" },
    animate: isDesktop
      ? { opacity: 1, scale: 1, y: 0 }
      : { opacity: 1, y: 0 },
    exit: isDesktop
      ? { opacity: 0, scale: 0.95, y: 16 }
      : { opacity: 0, y: "100%" },
    transition: { type: "spring", damping: 30, stiffness: 340 },
  };
}

/** Responsive shell: bottom sheet on mobile, centered dialog on desktop. */
export function modalShellClass(desktopWidth = "28rem"): string {
  return [
    "fixed z-[201] flex max-h-[min(92vh,720px)] flex-col overflow-hidden",
    "border border-cardBorder bg-card",
    "shadow-[0_-16px_48px_rgba(0,0,0,0.45)]",
    "inset-x-0 bottom-0 rounded-t-[1.75rem]",
    "lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2",
    `lg:w-[min(calc(100vw-2rem),${desktopWidth})] lg:-translate-x-1/2 lg:-translate-y-1/2`,
    "lg:rounded-2xl lg:shadow-[0_0_60px_rgba(139,92,246,0.2)]",
  ].join(" ");
}

interface ModalBackdropProps {
  onClose: () => void;
  label: string;
  disabled?: boolean;
}

export function ModalBackdrop({ onClose, label, disabled }: ModalBackdropProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      disabled={disabled}
      onClick={onClose}
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md"
    />
  );
}

interface ModalCloseButtonProps {
  onClick: () => void;
  disabled?: boolean;
  accent?: "violet" | "emerald";
}

export function ModalCloseButton({
  onClick,
  disabled,
  accent = "violet",
}: ModalCloseButtonProps) {
  const hoverClass =
    accent === "emerald"
      ? "hover:border-neonEmerald/40"
      : "hover:border-neonViolet/40";

  return (
    <button
      type="button"
      aria-label="Close"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cardBorder/80 bg-background/80 text-zinc-400 backdrop-blur-sm transition-colors hover:text-zinc-100 lg:h-9 lg:w-9 ${hoverClass}`}
    >
      <X className="h-5 w-5 lg:h-4 lg:w-4" />
    </button>
  );
}

export function ModalDragHandle() {
  return (
    <div
      aria-hidden
      className="mx-auto mb-3 h-1 w-10 rounded-full bg-cardBorder lg:hidden"
    />
  );
}

interface ModalHeaderProps {
  children: ReactNode;
  onClose: () => void;
  closeDisabled?: boolean;
  accent?: "violet" | "emerald";
}

export function ModalHeader({
  children,
  onClose,
  closeDisabled,
  accent = "violet",
}: ModalHeaderProps) {
  return (
    <div className="shrink-0 border-b border-cardBorder px-5 py-4 lg:px-6 lg:py-5">
      <ModalDragHandle />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">{children}</div>
        <ModalCloseButton
          onClick={onClose}
          disabled={closeDisabled}
          accent={accent}
        />
      </div>
    </div>
  );
}

/** Sticky footer with safe-area padding for mobile bottom sheets. */
export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 shrink-0 border-t border-cardBorder/70 bg-card/95 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:border-t-0 lg:bg-transparent lg:pb-0 lg:pt-0 lg:backdrop-blur-none">
      {children}
    </div>
  );
}
