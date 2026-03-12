"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteStudioSectionProps {
  studioName: string;
}

export default function DeleteStudioSection({ studioName }: DeleteStudioSectionProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [input, setInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (input !== "DELETE MY STUDIO") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/studio/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE MY STUDIO" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Studio permanently deleted.");
        router.push("/sign-in");
      } else {
        toast.error(data.error || "Failed to delete studio");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-12 border border-red-500/20 rounded-xl bg-red-500/[0.03] p-5">
      <div className="flex items-start gap-3 mb-3">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-red-400">
            Delete Studio
          </h3>
          <p className="text-xs text-[#A8A49A]/50 mt-1 leading-relaxed">
            Permanently delete <strong className="text-white/70">{studioName}</strong> and
            all associated data including all user accounts, earnings, shifts, stream data,
            chat history, and settings. All users will be removed and can create new accounts.
            This action cannot be undone.
          </p>
        </div>
      </div>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="ml-8 text-xs text-red-400/70 hover:text-red-400 font-medium transition-colors"
        >
          I want to delete this studio...
        </button>
      ) : (
        <div className="ml-8 mt-4 space-y-3">
          <p className="text-xs text-red-400/80">
            Type <strong className="text-red-400 font-mono">DELETE MY STUDIO</strong> to confirm:
          </p>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="DELETE MY STUDIO"
            className="w-full max-w-sm text-sm text-white bg-white/[0.04] border border-red-500/20 rounded-lg px-3 py-2 outline-none focus:border-red-500/50 placeholder:text-[#A8A49A]/20 font-mono"
            autoFocus
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={input !== "DELETE MY STUDIO" || deleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
              Permanently Delete Everything
            </button>
            <button
              onClick={() => { setShowConfirm(false); setInput(""); }}
              className="text-xs text-[#A8A49A]/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
