"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Delete, Loader2 } from "lucide-react";
import { verifyPin } from "@/app/actions/aiAndAuthActions";
import { isRedirectError } from "next/dist/client/components/redirect-error";

interface PinPadProps {
  onSuccess?: () => void;
}

const PIN_LENGTH = 4;
const KEYPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

type PinPhase = "idle" | "verifying" | "unlocking" | "error";

export default function PinPad({ onSuccess }: PinPadProps) {
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const [pin, setPin] = useState("");
  const [phase, setPhase] = useState<PinPhase>("idle");
  const [shake, setShake] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLocked = phase === "verifying" || phase === "unlocking";

  const submitPin = useCallback(async (pinValue: string) => {
    if (pinValue.length !== PIN_LENGTH) {
      return;
    }

    setPhase("verifying");
    setShake(false);
    setErrorMessage(null);

    try {
      const success = await verifyPin(pinValue);

      if (success) {
        setPhase("unlocking");
        onSuccessRef.current?.();
        return;
      }

      setPhase("error");
      setShake(true);
      setPin("");
    } catch (error) {
      if (isRedirectError(error)) {
        setPhase("unlocking");
        onSuccessRef.current?.();
        return;
      }

      setPhase("error");
      setShake(true);
      setPin("");
      setErrorMessage(
        error instanceof Error ? error.message : "Verification failed.",
      );
    }
  }, []);

  useEffect(() => {
    if (!shake) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShake(false);
      setPhase("idle");
    }, 480);

    return () => window.clearTimeout(timer);
  }, [shake]);

  const appendDigit = (digit: string) => {
    if (isLocked || pin.length >= PIN_LENGTH) {
      return;
    }

    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMessage(null);

    if (phase === "error") {
      setPhase("idle");
    }

    if (nextPin.length === PIN_LENGTH) {
      void submitPin(nextPin);
    }
  };

  const handleBackspace = () => {
    if (isLocked) {
      return;
    }

    setPin((current) => current.slice(0, -1));
    setErrorMessage(null);

    if (phase === "error") {
      setPhase("idle");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-background/80">
      <motion.div
        animate={
          phase === "unlocking"
            ? { opacity: 0, scale: 1.02 }
            : { opacity: 1, scale: 1 }
        }
        transition={{ duration: 0.45, ease: "easeInOut" }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.12),transparent_55%)]"
      />

      <motion.div
        animate={
          phase === "unlocking"
            ? { opacity: 0, y: -12, scale: 0.98 }
            : { opacity: 1, y: 0, scale: 1 }
        }
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="relative flex w-full max-w-sm flex-col items-center px-8"
      >
        <div className="mb-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-neonViolet/80">
            Secure Access
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-wide text-zinc-100">
            Enter your PIN
          </h2>
          <p className="mt-2 text-sm text-zinc-500">4-digit code</p>
        </div>

        <motion.div
          animate={
            shake
              ? { x: [0, -14, 14, -10, 10, -6, 6, 0] }
              : { x: 0 }
          }
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="relative mb-8 flex h-14 items-center justify-center gap-4"
          aria-label={`PIN length ${pin.length} of ${PIN_LENGTH}`}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, index) => {
            const isFilled = index < pin.length;
            const isActive = phase === "verifying" && index === pin.length - 1;

            return (
              <motion.span
                key={index}
                animate={
                  phase === "unlocking"
                    ? {
                        scale: 1.1,
                        boxShadow: "0 0 20px rgba(16, 185, 129, 0.8)",
                      }
                    : isFilled
                      ? {
                          scale: [1, 1.12, 1],
                          boxShadow: [
                            "0 0 0 rgba(139, 92, 246, 0)",
                            "0 0 18px rgba(139, 92, 246, 0.85)",
                            "0 0 12px rgba(139, 92, 246, 0.55)",
                          ],
                        }
                      : { scale: 1, boxShadow: "0 0 0 rgba(139, 92, 246, 0)" }
                }
                transition={{ duration: 0.22 }}
                className={`h-4 w-4 rounded-full border transition-colors ${
                  phase === "unlocking"
                    ? "border-neonEmerald bg-neonEmerald"
                    : isFilled
                      ? "border-neonViolet bg-neonViolet shadow-[0_0_14px_rgba(139,92,246,0.75)]"
                      : isActive
                        ? "border-neonViolet/60 bg-neonViolet/20"
                        : "border-cardBorder bg-card/50"
                }`}
              />
            );
          })}

          <AnimatePresence>
            {phase === "verifying" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-neonViolet/30 bg-card/90 shadow-[0_0_24px_rgba(139,92,246,0.2)]">
                  <Loader2 className="h-5 w-5 animate-spin text-neonViolet" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence mode="wait">
          {phase === "verifying" && (
            <motion.p
              key="verifying"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-6 flex items-center gap-2 text-sm text-neonViolet/90"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Verifying PIN...
            </motion.p>
          )}

          {phase === "unlocking" && (
            <motion.div
              key="unlocking"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex flex-col items-center gap-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-neonEmerald/40 bg-neonEmerald/10">
                <Check className="h-5 w-5 text-neonEmerald" />
              </div>
              <p className="text-sm font-medium text-neonEmerald">
                Unlocked — opening dashboard...
              </p>
            </motion.div>
          )}

          {phase === "error" && errorMessage && (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 max-w-xs text-center text-sm text-neonCrimson"
            >
              {errorMessage}
            </motion.p>
          )}

          {phase === "error" && !errorMessage && (
            <motion.p
              key="wrong-pin"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 text-sm text-neonCrimson"
            >
              Incorrect PIN. Try again.
            </motion.p>
          )}
        </AnimatePresence>

        <motion.div
          animate={{ opacity: phase === "unlocking" ? 0.3 : 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-3 gap-4"
        >
          {KEYPAD_KEYS.map((key) => (
            <PinButton
              key={key}
              disabled={isLocked}
              onClick={() => appendDigit(key)}
            >
              {key}
            </PinButton>
          ))}

          <div aria-hidden className="h-16 w-16" />

          <PinButton disabled={isLocked} onClick={() => appendDigit("0")}>
            0
          </PinButton>

          <PinButton
            disabled={isLocked || pin.length === 0}
            onClick={handleBackspace}
            aria-label="Delete last digit"
            variant="action"
          >
            <Delete className="h-5 w-5" strokeWidth={1.75} />
          </PinButton>
        </motion.div>
      </motion.div>
    </div>
  );
}

interface PinButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  "aria-label"?: string;
  variant?: "default" | "action";
}

function PinButton({
  children,
  disabled = false,
  onClick,
  "aria-label": ariaLabel,
  variant = "default",
}: PinButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`flex h-16 w-16 items-center justify-center rounded-full border text-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        variant === "action"
          ? "border-neonCrimson/30 bg-card/70 text-neonCrimson hover:border-neonCrimson/50 hover:bg-card"
          : "border-cardBorder bg-card/60 text-zinc-100 shadow-[0_0_24px_rgba(139,92,246,0.06)] hover:border-neonViolet/40 hover:bg-card hover:shadow-[0_0_28px_rgba(139,92,246,0.14)]"
      }`}
    >
      {children}
    </motion.button>
  );
}
