"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteStudioSectionProps {
  studioName: string;
}

export default function DeleteStudioSection({ studioName }: DeleteStudioSectionProps) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "warning" | "confirm">("idle");
  const [input, setInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (input.toLowerCase() !== "delete studio") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/studio/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE MY STUDIO" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Studio deleted.");
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

  if (step === "idle") {
    return (
      <div className="mt-12 flex items-center justify-between">
        <p className="text-xs text-[#A8A49A]/40">
          Want to permanently remove your studio?
        </p>
        <button
          onClick={() => setStep("warning")}
          className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
        >
          Delete Studio
        </button>
      </div>
    );
  }

  if (step === "warning") {
    return (
      <div className="mt-12 border border-white/[0.06] rounded-xl bg-white/[0.02] p-5">
        <p className="text-sm font-medium text-white mb-3">
          Delete {studioName}
        </p>
        <p className="text-xs text-[#A8A49A]/60 leading-relaxed mb-1">
          This will permanently delete:
        </p>
        <ul className="text-xs text-[#A8A49A]/50 leading-relaxed space-y-0.5 mb-4">
          <li>All user accounts (models, operators, accountants, admins)</li>
          <li>All earnings, payouts, and financial data</li>
          <li>All shifts, schedules, and stream history</li>
          <li>All chat messages, support tickets, and settings</li>
        </ul>
        <p className="text-xs text-[#A8A49A]/40 mb-5">
          Everyone will be able to create new accounts after deletion. This cannot be undone.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep("confirm")}
            className="px-4 py-2 text-xs font-medium text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            Continue
          </button>
          <button
            onClick={() => setStep("idle")}
            className="text-xs text-[#A8A49A]/40 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 border border-white/[0.06] rounded-xl bg-white/[0.02] p-5">
      <p className="text-sm font-medium text-white mb-3">
        Type <span className="text-[#A8A49A]/70">delete studio</span> to confirm
      </p>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="delete studio"
        className="w-full max-w-xs text-sm text-white bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 outline-none focus:border-white/[0.15] placeholder:text-[#A8A49A]/20"
        autoFocus
      />
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleDelete}
          disabled={input.toLowerCase() !== "delete studio" || deleting}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
          Delete Studio
        </button>
        <button
          onClick={() => { setStep("idle"); setInput(""); }}
          className="text-xs text-[#A8A49A]/40 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
