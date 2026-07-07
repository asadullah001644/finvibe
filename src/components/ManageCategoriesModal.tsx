"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ModalBackdrop,
  ModalFooter,
  ModalHeader,
  getModalMotionProps,
  modalShellClass,
  useIsDesktop,
} from "@/components/ui/modal";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import {
  addCustomCategoryAction,
  deleteCustomCategoryAction,
  updateCustomCategoryAction,
} from "@/lib/actions";
import { buildCustomCategoryFullName } from "@/lib/customCategories";
import { CATEGORY_SEPARATOR } from "@/lib/constants";
import type { CustomCategoryRecord } from "@/lib/customCategories";

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  customCategories: CustomCategoryRecord[];
}

const fieldLabelClass =
  "mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500";

const fieldInputClass =
  "h-11 w-full rounded-xl border border-cardBorder/70 bg-[#0C0C0F]/60 px-3.5 text-sm text-zinc-100 outline-none ring-1 ring-white/[0.02] transition-colors placeholder:text-zinc-600 focus:border-neonViolet/50 focus:ring-neonViolet/20";

function formatPreviewPath(path: string) {
  if (!path.includes(CATEGORY_SEPARATOR)) {
    return path;
  }

  const [parent, ...rest] = path.split(CATEGORY_SEPARATOR).map((part) => part.trim());
  return (
    <>
      {parent}
      <span className="text-zinc-500">{CATEGORY_SEPARATOR}</span>
      {rest.join(CATEGORY_SEPARATOR).trim()}
    </>
  );
}

export default function ManageCategoriesModal({
  isOpen,
  onClose,
  customCategories,
}: ManageCategoriesModalProps) {
  const { refresh } = useAppNavigation();
  const isDesktop = useIsDesktop();
  const [mounted, setMounted] = useState(false);
  const [groupLabel, setGroupLabel] = useState("");
  const [leafName, setLeafName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError(null);
    setEditingId(null);
    setGroupLabel("");
    setLeafName("");
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const previewPath = useMemo(() => {
    if (!leafName.trim()) {
      return null;
    }

    return buildCustomCategoryFullName(groupLabel, leafName);
  }, [groupLabel, leafName]);

  const resetForm = () => {
    setEditingId(null);
    setGroupLabel("");
    setLeafName("");
    setError(null);
  };

  const startEdit = (category: CustomCategoryRecord) => {
    setEditingId(category.id);
    setGroupLabel(category.groupLabel ?? "");
    setLeafName(category.leafName);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = editingId
      ? await updateCustomCategoryAction({
          id: editingId,
          groupLabel: groupLabel.trim() || undefined,
          leafName,
        })
      : await addCustomCategoryAction({
          groupLabel: groupLabel.trim() || undefined,
          leafName,
        });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Could not save category.");
      return;
    }

    resetForm();
    await refresh();
  };

  const handleDelete = async (id: string) => {
    setError(null);
    setDeletingId(id);

    const result = await deleteCustomCategoryAction(id);
    setDeletingId(null);

    if (!result.success) {
      setError(result.error ?? "Could not remove category.");
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    await refresh();
  };

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <ModalBackdrop
            onClose={onClose}
            label="Close manage categories"
            disabled={isSubmitting}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-category-title"
            {...getModalMotionProps(isDesktop)}
            className={modalShellClass("32rem")}
          >
            <ModalHeader onClose={onClose} closeDisabled={isSubmitting}>
              <h2
                id="manage-category-title"
                className="text-lg font-semibold tracking-tight text-zinc-100 lg:text-xl"
              >
                {editingId ? "Edit category" : "Add category"}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Custom categories are shared with all users. Built-in categories
                (Food, Transport, etc.) cannot be removed.
              </p>
            </ModalHeader>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 lg:px-6">
              <div className="mb-6">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Your custom categories
                </p>
                {customCategories.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-cardBorder bg-background/40 px-4 py-5 text-center text-sm text-zinc-500">
                    No custom categories yet. Add one below — it will appear here
                    with Edit and Delete options.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {customCategories.map((category) => (
                      <li
                        key={category.id}
                        className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                          editingId === category.id
                            ? "border-neonViolet/40 bg-neonViolet/10"
                            : "border-cardBorder/70 bg-background/40"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-200">
                            {category.fullName}
                          </p>
                          {category.groupLabel && (
                            <p className="text-xs text-zinc-600">
                              Group · {category.groupLabel}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(category)}
                            disabled={isSubmitting || deletingId !== null}
                            className="inline-flex items-center gap-1 rounded-lg border border-cardBorder px-2.5 py-1.5 text-xs text-zinc-500 transition-colors hover:border-neonViolet/30 hover:text-neonViolet disabled:opacity-60"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(category.id)}
                            disabled={deletingId === category.id || isSubmitting}
                            className="inline-flex items-center gap-1 rounded-lg border border-neonCrimson/30 px-2.5 py-1.5 text-xs text-neonCrimson/90 transition-colors hover:bg-neonCrimson/10 disabled:opacity-60"
                          >
                            {deletingId === category.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <form
                id="manage-category-form"
                onSubmit={handleSubmit}
                className="space-y-4 border-t border-cardBorder/70 pt-5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {editingId ? "Update details" : "New category"}
                </p>

                <div>
                  <label htmlFor="category-group" className={fieldLabelClass}>
                    Group (optional)
                  </label>
                  <input
                    id="category-group"
                    type="text"
                    value={groupLabel}
                    onChange={(event) => setGroupLabel(event.target.value)}
                    placeholder="e.g. Business"
                    className={fieldInputClass}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="category-name" className={fieldLabelClass}>
                    Category name
                  </label>
                  <input
                    id="category-name"
                    type="text"
                    value={leafName}
                    onChange={(event) => setLeafName(event.target.value)}
                    placeholder={
                      groupLabel.trim() ? "e.g. Marketing" : "e.g. Freelance"
                    }
                    className={fieldInputClass}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                {previewPath && (
                  <div className="rounded-xl border border-neonViolet/25 bg-neonViolet/5 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {editingId ? "Will update to" : "Will appear as"}
                    </p>
                    <p className="mt-1 text-sm font-medium text-neonViolet">
                      {formatPreviewPath(previewPath)}
                    </p>
                  </div>
                )}

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
                  >
                    Cancel edit · add new instead
                  </button>
                )}

                {error && (
                  <p className="rounded-xl border border-neonCrimson/30 bg-neonCrimson/10 px-3 py-2 text-sm text-neonCrimson">
                    {error}
                  </p>
                )}
              </form>
            </div>

            <ModalFooter>
              <button
                type="submit"
                form="manage-category-form"
                disabled={isSubmitting || !leafName.trim()}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neonViolet/40 bg-neonViolet/15 px-5 py-2.5 text-sm font-semibold text-neonViolet transition-colors hover:bg-neonViolet/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : editingId ? (
                  <>
                    <Pencil className="h-4 w-4" />
                    Save changes
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add category
                  </>
                )}
              </button>
            </ModalFooter>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) {
    return null;
  }

  return createPortal(modal, document.body);
}
