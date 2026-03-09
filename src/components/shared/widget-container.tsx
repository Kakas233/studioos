"use client";

import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, LayoutGrid, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WidgetWrapperProps {
  id: string;
  title: string;
  children: ReactNode;
  onRemove: (id: string) => void;
  removable?: boolean;
}

export function WidgetWrapper({
  id,
  title,
  children,
  onRemove,
  removable = true,
}: WidgetWrapperProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative group"
    >
      {removable && (
        <button
          onClick={() => onRemove(id)}
          className="absolute -top-2 -right-2 z-10 w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}
      {children}
    </motion.div>
  );
}

interface WidgetDef {
  id: string;
  label: string;
  col: string;
}

interface WidgetSelectorProps {
  allWidgets: WidgetDef[];
  activeIds: string[];
  onToggle: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function WidgetSelector({
  allWidgets,
  activeIds,
  onToggle,
  isOpen,
  onClose,
}: WidgetSelectorProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 mb-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-[#C9A84C]" />
          <span className="text-sm text-white font-medium">
            Customize Dashboard
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-[#A8A49A]/40 hover:text-white h-7"
        >
          Done
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {allWidgets.map((w) => {
          const active = activeIds.includes(w.id);
          return (
            <button
              key={w.id}
              onClick={() => onToggle(w.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all text-xs ${
                active
                  ? "border-[#C9A84C]/30 bg-[#C9A84C]/8 text-[#C9A84C]"
                  : "border-white/[0.04] bg-white/[0.02] text-[#A8A49A]/40 hover:text-white hover:border-white/[0.08]"
              }`}
            >
              {active ? (
                <Check className="w-3 h-3 shrink-0" />
              ) : (
                <Plus className="w-3 h-3 shrink-0" />
              )}
              <span className="truncate">{w.label}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
