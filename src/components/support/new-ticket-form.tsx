"use client";

import { useState } from "react";
import { ArrowLeft, X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NewTicketFormProps {
  accessToken: string | null;
  onCreated: (ticketId: string, message: string) => void;
  onCancel: () => void;
  onClose: () => void;
  agentImages?: Record<string, string>;
  isPublic?: boolean;
}

export default function NewTicketForm({
  accessToken,
  onCreated,
  onCancel,
  onClose,
  agentImages,
  isPublic,
}: NewTicketFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (isPublic) {
      if (!email.trim()) {
        toast.error("Please enter your email so we can reply");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/support/public-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            message: message.trim(),
          }),
        });
        const data = await res.json();
        if (data.success) {
          setSent(true);
        } else {
          toast.error(
            "Something went wrong. Try emailing support@getstudioos.com directly."
          );
        }
      } catch {
        toast.error(
          "Something went wrong. Try emailing support@getstudioos.com directly."
        );
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          action: "create",
          subject: message.trim(),
          category: "general",
          email: email.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onCreated(data.ticket_id, message.trim());
      } else {
        toast.error(data.error || "Failed to send message");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-gray-900 flex-1">
            StudioOS
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">{"\u2713"}</span>
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">
            Message sent!
          </p>
          <p className="text-xs text-gray-400">
            We will get back to you at {email} within an hour.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex -space-x-1.5">
          {Object.entries(agentImages || {}).map(([key, url]) => (
            <img
              key={key}
              src={url}
              alt=""
              className="w-6 h-6 rounded-full border-2 border-white object-cover"
            />
          ))}
        </div>
        <span className="text-sm font-semibold text-gray-900 flex-1">
          StudioOS
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 py-4">
        <p className="text-sm text-gray-400">
          Ask us anything, or share your feedback.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          We usually reply within an hour.
        </p>
      </div>

      <div className="flex-1" />

      <div className="p-4 border-t border-gray-200">
        <div className="border border-[#C9A84C]/30 rounded-xl p-3 focus-within:border-[#C9A84C]/60 transition-colors bg-gray-50">
          {isPublic && (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none mb-2 pb-2 border-b border-gray-200"
            />
          )}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message..."
            rows={3}
            className="w-full text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex justify-end items-center gap-2 mt-1">
            <button
              onClick={handleSubmit}
              disabled={loading || !message.trim()}
              className="w-8 h-8 rounded-full bg-[#C9A84C] hover:bg-[#B8973B] disabled:opacity-40 disabled:hover:bg-[#C9A84C] flex items-center justify-center transition-colors"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 text-gray-900 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 text-gray-900" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
