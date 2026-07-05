"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useAppShellActions } from "@/components/AppShellProvider";

interface CarryForwardNoticeProps {
  carriedFromMonthLabel: string;
}

export default function CarryForwardNotice({
  carriedFromMonthLabel,
}: CarryForwardNoticeProps) {
  const { openIncome } = useAppShellActions();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 8000);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed inset-x-4 bottom-[5.75rem] z-[150] mx-auto max-w-lg sm:bottom-24"
        >
          <div className="flex items-center gap-3 rounded-xl border border-neonViolet/30 bg-card/95 px-4 py-3 shadow-[0_0_30px_rgba(139,92,246,0.15)] backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                setVisible(false);
                openIncome();
              }}
              className="flex-1 text-left text-sm text-zinc-200"
            >
              Carried forward from{" "}
              <span className="font-medium text-neonViolet">
                {carriedFromMonthLabel}
              </span>{" "}
              — tap to edit
            </button>
            <button
              type="button"
              aria-label="Dismiss notice"
              onClick={() => setVisible(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cardBorder text-zinc-400 transition-colors hover:border-neonViolet/40 hover:text-zinc-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
