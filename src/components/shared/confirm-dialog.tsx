"use client";

import { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-[#C9A84C] hover:bg-[#B8973B] text-black"
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook for managing confirm dialog state.
 * Usage:
 *   const { confirm, ConfirmDialogEl } = useConfirmDialog();
 *   // In handler: const ok = await confirm({ title: "Delete?", description: "..." });
 *   // In JSX: {ConfirmDialogEl}
 */
export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    variant?: "destructive" | "default";
    resolve?: (value: boolean) => void;
  }>({ open: false, title: "", description: "" });

  const confirm = useCallback(
    (opts: {
      title: string;
      description: string;
      confirmLabel?: string;
      variant?: "destructive" | "default";
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({ ...opts, open: true, resolve });
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState((s) => ({ ...s, open: false }));
  }, [state]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        state.resolve?.(false);
      }
      setState((s) => ({ ...s, open }));
    },
    [state]
  );

  const ConfirmDialogEl = (
    <ConfirmDialog
      open={state.open}
      onOpenChange={handleOpenChange}
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel || "Confirm"}
      variant={state.variant}
      onConfirm={handleConfirm}
    />
  );

  return { confirm, ConfirmDialogEl };
}
