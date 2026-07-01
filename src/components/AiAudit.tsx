"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ShieldCheck, Sparkles, Terminal } from "lucide-react";
import { runFinancialAudit } from "@/app/actions/aiAndAuthActions";

interface AuditExpense {
  amount: number;
  category: string;
  description: string;
  date: Date | string;
}

interface AuditBudget {
  totalSalary: number;
  savingsGoal: number;
  categories?: Array<{ name: string; allocated: number }>;
  monthKey?: string;
}

interface AiAuditProps {
  budget: AuditBudget;
  expenses: AuditExpense[];
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-neonViolet">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
}

function MarkdownAnalysis({ content }: { content: string }) {
  const blocks = content.split("\n");

  return (
    <div className="space-y-3 text-sm leading-7 text-zinc-300">
      {blocks.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return null;
        }

        if (trimmed.startsWith("### ")) {
          return (
            <h4
              key={index}
              className="pt-2 text-sm font-semibold uppercase tracking-[0.18em] text-neonViolet/90"
            >
              {renderInlineMarkdown(trimmed.slice(4))}
            </h4>
          );
        }

        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={index} className="text-base font-semibold text-zinc-100">
              {renderInlineMarkdown(trimmed.slice(3))}
            </h3>
          );
        }

        if (trimmed.startsWith("# ")) {
          return (
            <h2 key={index} className="text-lg font-semibold text-zinc-100">
              {renderInlineMarkdown(trimmed.slice(2))}
            </h2>
          );
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={index} className="flex gap-3 pl-1">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neonViolet shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
              <p>{renderInlineMarkdown(trimmed.slice(2))}</p>
            </div>
          );
        }

        return <p key={index}>{renderInlineMarkdown(trimmed)}</p>;
      })}
    </div>
  );
}

function AuditSkeleton() {
  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-2 text-sm text-neonViolet/80">
        <Terminal className="h-4 w-4 animate-pulse" />
        <span>Gemini is reviewing your capital flow...</span>
      </div>
      <div className="h-4 w-3/4 animate-pulse rounded bg-cardBorder/60" />
      <div className="h-4 w-full animate-pulse rounded bg-cardBorder/50" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-cardBorder/50" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-cardBorder/40" />
    </div>
  );
}

export default function AiAudit({ budget, expenses }: AiAuditProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runAudit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const auditText = await runFinancialAudit(expenses, budget);
      setAnalysis(auditText);
    } catch (auditError) {
      setAnalysis(null);
      setError(
        auditError instanceof Error
          ? auditError.message
          : "Unable to complete the Gemini audit.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-neonViolet/30 bg-card/60 p-6 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-neonViolet/80">
            AI Audit Module
          </p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-100">
            Capital Trajectory Review
          </h3>
          <p className="mt-2 max-w-xl text-sm text-zinc-500">
            Analyze your salary, savings goal, and category spending for
            actionable guidance on recovering your savings target.
          </p>
        </div>

        <motion.button
          type="button"
          onClick={runAudit}
          disabled={isLoading}
          whileTap={isLoading ? undefined : { scale: 0.97 }}
          className="relative inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-neonViolet/40 bg-neonViolet/10 px-5 py-3 text-sm font-semibold text-neonViolet transition-colors hover:bg-neonViolet/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <span className="pointer-events-none absolute inset-0 animate-pulse rounded-2xl bg-neonViolet/10 shadow-[0_0_24px_rgba(139,92,246,0.35)]" />
          <Sparkles className="relative h-4 w-4" />
          <span className="relative">Run Capital Audit Engine</span>
        </motion.button>
      </div>

      {isLoading && <AuditSkeleton />}

      {!isLoading && error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-neonCrimson/30 bg-neonCrimson/10 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-neonCrimson" />
          <p className="text-sm text-neonCrimson">{error}</p>
        </div>
      )}

      {!isLoading && analysis && (
        <div className="mt-6 rounded-2xl border border-cardBorder bg-background/50 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-neonEmerald">
            <ShieldCheck className="h-4 w-4" />
            Audit complete
          </div>
          <MarkdownAnalysis content={analysis} />
        </div>
      )}
    </section>
  );
}
