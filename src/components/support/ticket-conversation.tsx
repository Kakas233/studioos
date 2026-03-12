"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, ArrowLeft, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const IDLE_CHECK_MS = 5 * 60 * 1000; // 5 minutes
const IDLE_CLOSE_MS = 10 * 60 * 1000; // 10 minutes
const IDLE_POLL_MS = 15000; // check every 15 seconds

interface Message {
  role: "user" | "agent" | "system";
  content: string;
  timestamp?: string;
  agent_name?: string;
}

interface Agent {
  name?: string;
  title?: string;
}

interface TicketData {
  id: string;
  status: string;
  assigned_agent?: string;
  messages?: Message[];
  is_escalated?: boolean;
}

interface TicketConversationProps {
  ticketId: string;
  accessToken: string | null;
  agents: Record<string, { name: string; title: string }>;
  agentImages?: Record<string, string>;
  onBack: () => void;
  onClose: () => void;
  isNewTicket: boolean;
  initialMessage: string;
}

export default function TicketConversation({
  ticketId,
  accessToken,
  agents,
  agentImages,
  onBack,
  onClose,
  isNewTicket,
  initialMessage,
}: TicketConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [agentTyping, setAgentTyping] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [chatClosed, setChatClosed] = useState(false);
  const [agentRevealed, setAgentRevealed] = useState(!isNewTicket);
  const [closingFlow, setClosingFlow] = useState<string | null>(null);
  const [isEscalated, setIsEscalated] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Onboarding sequence state
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingMessages, setOnboardingMessages] = useState<Message[]>(
    []
  );
  const onboardingRan = useRef(false);

  // Idle timer refs
  const lastActivityRef = useRef(Date.now());
  const idleCheckTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const idleCheckSentRef = useRef(false);

  // Reset activity on any user action
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (idleCheckSentRef.current) {
      idleCheckSentRef.current = false;
    }
  }, []);

  // Start idle monitoring
  useEffect(() => {
    if (chatClosed || closingFlow) return;

    const checkIdle = () => {
      if (isNewTicket && onboardingStep < 5 && onboardingStep > 0) {
        lastActivityRef.current = Date.now();
        return;
      }

      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= IDLE_CLOSE_MS && idleCheckSentRef.current) {
        const ticketNumber = ticket
          ? `#${String(ticket.id).slice(-6).toUpperCase()}`
          : "";
        const closeMsg: Message = {
          role: "system",
          content: `Since we haven't heard from you in a while, we're closing this chat. Thanks for reaching out! If you need more help, feel free to open a new conversation${ticketNumber ? ` and reference ticket ${ticketNumber}` : ""} so we can pick up where we left off.`,
          timestamp: new Date().toISOString(),
        };
        if (isNewTicket) {
          setOnboardingMessages((prev) => [...prev, closeMsg]);
        } else {
          setMessages((prev) => [...prev, closeMsg]);
        }
        setChatClosed(true);
        if (ticketId) {
          fetch("/api/support/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              action: "close",
              ticket_id: ticketId,
            }),
          }).catch(() => {});
        }
        return;
      }

      if (elapsed >= IDLE_CHECK_MS && !idleCheckSentRef.current) {
        idleCheckSentRef.current = true;
        const checkMsg: Message = {
          role: "system",
          content: `Hey, are you still there? Just checking in \u2014 if we don't hear back in a few minutes we'll close this chat.`,
          timestamp: new Date().toISOString(),
        };
        if (isNewTicket) {
          setOnboardingMessages((prev) => [...prev, checkMsg]);
        } else {
          setMessages((prev) => [...prev, checkMsg]);
        }
      }
    };

    idleCheckTimerRef.current = setInterval(checkIdle, IDLE_POLL_MS);
    return () => {
      if (idleCheckTimerRef.current)
        clearInterval(idleCheckTimerRef.current);
    };
  }, [
    ticket,
    chatClosed,
    closingFlow,
    isNewTicket,
    onboardingStep,
    ticketId,
    accessToken,
  ]);

  useEffect(() => {
    loadTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentTyping, onboardingMessages, onboardingStep]);

  // Run the staged onboarding when ticket is loaded and it's a new ticket
  useEffect(() => {
    if (!isNewTicket || !ticket || onboardingRan.current) return;
    onboardingRan.current = true;
    runOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket, isNewTicket]);

  const runOnboarding = async () => {
    const ticketNumber = `#${String(ticket!.id).slice(-6).toUpperCase()}`;

    if (initialMessage) {
      setOnboardingMessages([
        {
          role: "user",
          content: initialMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
      await new Promise((r) => setTimeout(r, 800));
    }

    setOnboardingStep(1);
    setOnboardingMessages((prev) => [
      ...prev,
      {
        role: "system",
        content: `Thanks for reaching out to StudioOS support!`,
        timestamp: new Date().toISOString(),
      },
    ]);

    await new Promise((r) => setTimeout(r, 2000));

    setOnboardingStep(2);
    setOnboardingMessages((prev) => [
      ...prev,
      {
        role: "system",
        content: `Your ticket number is ${ticketNumber}. Keep this handy \u2014 if the chat disconnects, you can reference it to continue where we left off.`,
        timestamp: new Date().toISOString(),
      },
    ]);

    await new Promise((r) => setTimeout(r, 3000));

    setOnboardingStep(3);
    setOnboardingMessages((prev) => [
      ...prev,
      {
        role: "system",
        content: `Hang tight, we're connecting you with a support agent...`,
        timestamp: new Date().toISOString(),
      },
    ]);

    await new Promise(
      (r) => setTimeout(r, 5000 + Math.random() * 3000)
    );

    setOnboardingStep(4);
    setAgentTyping(true);

    await new Promise(
      (r) => setTimeout(r, 4000 + Math.random() * 2000)
    );
    setAgentTyping(false);

    setAgentRevealed(true);
    const agentName = agent?.name || "Support";
    setOnboardingMessages((prev) => [
      ...prev,
      {
        role: "agent",
        content: `Hey! I'm ${agentName}, I'll be looking into this for you. One sec while I check things out.`,
        agent_name: ticket?.assigned_agent,
        timestamp: new Date().toISOString(),
      },
    ]);

    await new Promise(
      (r) => setTimeout(r, 6000 + Math.random() * 4000)
    );
    setAgentTyping(true);

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          action: "get",
          ticket_id: ticketId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAgent(data.agent);
        setTicket(data.ticket);

        const realMessages: Message[] = data.ticket.messages || [];
        const agentReply = realMessages.find((m) => m.role === "agent");

        await new Promise(
          (r) => setTimeout(r, 4000 + Math.random() * 3000)
        );
        setAgentTyping(false);

        if (agentReply) {
          setOnboardingMessages((prev) => [
            ...prev,
            {
              role: "agent",
              content: agentReply.content,
              agent_name: agentReply.agent_name,
              timestamp: agentReply.timestamp,
            },
          ]);
        }
      } else {
        setAgentTyping(false);
      }
    } catch (err) {
      setAgentTyping(false);
      console.error("Failed to get agent reply:", err);
    }

    setOnboardingStep(5);
    lastActivityRef.current = Date.now();
  };

  const loadTicket = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          action: "get",
          ticket_id: ticketId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (!isNewTicket) {
          setMessages(data.ticket.messages || []);
        }
        setAgent(data.agent);
        setTicket(data.ticket);
        if (data.ticket.is_escalated) setIsEscalated(true);
      }
    } catch (err) {
      console.error("Failed to load ticket:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending || chatClosed) return;

    resetActivity();
    const userMessage = input.trim();
    setInput("");
    setSending(true);

    if (isNewTicket && onboardingStep >= 5) {
      setOnboardingMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: userMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    const newMessages: Message[] = [
      ...messages,
      {
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
    ];
    setMessages(newMessages);

    const startTime = Date.now();
    const referencesTicket = /#[A-Za-z0-9]{4,8}/.test(userMessage);

    const readDelay = 3000 + Math.random() * 4000;
    const typingTimer = setTimeout(
      () => setAgentTyping(true),
      readDelay
    );

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          action: "message",
          ticket_id: ticketId,
          message: userMessage,
        }),
      });

      const elapsed = Date.now() - startTime;
      const minDelay = referencesTicket
        ? 14000 + Math.random() * 6000
        : 8000 + Math.random() * 7000;
      const remaining = minDelay - elapsed;
      if (remaining > 0) {
        await new Promise((r) => setTimeout(r, remaining));
      }

      setAgentTyping(false);

      const data = await res.json();
      if (data.success) {
        if (isNewTicket && onboardingStep >= 5) {
          const latestAgentMsg = (data.messages as Message[])
            .filter((m) => m.role === "agent")
            .slice(-1)[0];
          if (latestAgentMsg) {
            setOnboardingMessages((prev) => [...prev, latestAgentMsg]);
          }
        } else {
          setMessages(data.messages);
        }
        if (data.agent) setAgent(data.agent);
        if (data.escalated) setIsEscalated(true);

        const latestAgent = (data.messages as Message[])
          ?.filter((m) => m.role === "agent")
          .slice(-1)[0];
        if (latestAgent) {
          const content = latestAgent.content.toLowerCase();
          const closingPhrases = [
            "anything else",
            "is there anything else",
            "let me know if",
            "hope that helps",
            "does that answer",
            "did that help",
            "all sorted",
            "all good",
          ];
          const mightBeResolved = closingPhrases.some((p) =>
            content.includes(p)
          );
          if (mightBeResolved && !closingFlow && !chatClosed) {
            setTimeout(() => {
              setClosingFlow("ask_close");
            }, 3000);
          }
        }
      } else {
        toast.error(data.error || "Failed to send message");
      }
    } catch {
      clearTimeout(typingTimer);
      setAgentTyping(false);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleRating = async (stars: number) => {
    setRating(stars);
    setRatingSubmitted(true);
    try {
      await fetch("/api/support/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          action: "rate",
          ticket_id: ticketId,
          rating: stars,
        }),
      });
    } catch {
      // silent
    }
  };

  const handleEscalate = async () => {
    if (escalating || isEscalated) return;
    setEscalating(true);
    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          action: "escalate",
          ticket_id: ticketId,
          escalation_reason: "user_request",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEscalated(true);
        if (isNewTicket && onboardingStep >= 5) {
          const escalationMsg = (data.messages as Message[])?.find(
            (m) =>
              m.role === "system" && m.content.includes("escalated")
          );
          if (escalationMsg) {
            setOnboardingMessages((prev) => [...prev, escalationMsg]);
          }
        } else {
          setMessages(data.messages || []);
        }
      }
    } catch {
      toast.error("Failed to escalate");
    } finally {
      setEscalating(false);
    }
  };

  const handleReopen = async () => {
    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          action: "reopen",
          ticket_id: ticketId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTicket((prev) =>
          prev ? { ...prev, status: "in_progress" } : prev
        );
        setRatingSubmitted(false);
        setRating(0);
      }
    } catch {
      toast.error("Failed to reopen");
    }
  };

  const formatTime = (ts?: string) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const agentImage = agent
    ? agentImages?.[ticket?.assigned_agent || ""]
    : null;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <Loader2 className="w-5 h-5 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  const isResolved =
    ticket?.status === "resolved" || ticket?.status === "closed";

  const renderMessage = (msg: Message, i: number, keyPrefix: string) => {
    const isUser = msg.role === "user";
    const isSystem = msg.role === "system";
    return (
      <div
        key={`${keyPrefix}-${i}`}
        className={cn(
          "flex gap-2",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        {!isUser && !isSystem && agentImage && (
          <img
            src={agentImage}
            alt=""
            className="w-6 h-6 rounded-full object-cover mt-1 shrink-0"
          />
        )}
        {isSystem && (
          <div className="w-6 h-6 rounded-full bg-[#C9A84C]/10 flex items-center justify-center mt-1 shrink-0">
            <span className="text-[10px]">{"\uD83D\uDCAC"}</span>
          </div>
        )}
        <div className="max-w-[85%] sm:max-w-[80%]">
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
              isUser
                ? "bg-[#C9A84C] text-white rounded-br-sm"
                : isSystem
                  ? "bg-amber-50 border border-amber-200/60 text-gray-600 rounded-bl-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
            )}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
          <p
            className={cn(
              "text-[9px] mt-0.5 px-1",
              isUser ? "text-right text-gray-300" : "text-gray-300"
            )}
          >
            {formatTime(msg.timestamp)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.08] shrink-0">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        {agentRevealed && agentImage ? (
          <img
            src={agentImage}
            alt=""
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : !agentRevealed ? (
          <div className="w-7 h-7 rounded-full bg-[#C9A84C]/10 flex items-center justify-center">
            <span className="text-xs">{"\uD83D\uDCAC"}</span>
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">
            {agentRevealed
              ? agent?.name || "Support"
              : "StudioOS Support"}
          </p>
          <p className="text-[10px] text-gray-400">
            {agentRevealed ? agent?.title : "Connecting..."}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-3">
          {/* Onboarding sequence for new tickets */}
          {isNewTicket && onboardingStep > 0 && (
            <>
              {onboardingMessages.map((msg, i) =>
                renderMessage(msg, i, "onboard")
              )}

              {/* Connecting animation */}
              {(onboardingStep === 3 || onboardingStep === 4) &&
                !agentTyping &&
                onboardingStep < 5 &&
                !onboardingMessages.some(
                  (m) => m.role === "agent"
                ) && (
                  <div className="flex items-center gap-2 justify-center py-2">
                    <Loader2 className="w-3 h-3 animate-spin text-[#C9A84C]" />
                    <span className="text-xs text-gray-400">
                      Connecting you to an agent...
                    </span>
                  </div>
                )}
            </>
          )}

          {/* Regular messages (for existing tickets) */}
          {(!isNewTicket ? messages : []).map((msg, i) =>
            renderMessage(msg, i, "msg")
          )}

          {/* Typing indicator */}
          {agentTyping && (
            <div className="flex gap-2 justify-start">
              {agentImage && (
                <img
                  src={agentImage}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover mt-1 shrink-0"
                />
              )}
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span
                    className="w-1.5 h-1.5 bg-[#A8A49A]/40 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-[#A8A49A]/40 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-[#A8A49A]/40 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Closing flow: AI asks if it can close the chat */}
          {closingFlow === "ask_close" && !chatClosed && (
            <div className="flex gap-2 justify-start">
              {agentImage && (
                <img
                  src={agentImage}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover mt-1 shrink-0"
                />
              )}
              <div className="max-w-[80%]">
                <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[13px] leading-relaxed">
                  <p>
                    If there&apos;s nothing else, mind if I close this
                    chat?
                  </p>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setClosingFlow("resolved_question");
                      fetch("/api/support/chat", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                        },
                        body: JSON.stringify({
                          action: "close",
                          ticket_id: ticketId,
                        }),
                      }).catch(() => {});
                    }}
                    className="px-4 py-1.5 bg-[#C9A84C] text-white text-xs rounded-full hover:bg-[#B8973B] transition-colors"
                  >
                    Sure, go ahead
                  </button>
                  <button
                    onClick={() => {
                      setClosingFlow(null);
                      resetActivity();
                    }}
                    className="px-4 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 transition-colors"
                  >
                    No, I still need help
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Closing flow: automated thank you + resolved question */}
          {closingFlow === "resolved_question" && (
            <div className="space-y-3">
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-[#C9A84C]/10 flex items-center justify-center mt-1 shrink-0">
                  <span className="text-[10px]">
                    {"\uD83D\uDCAC"}
                  </span>
                </div>
                <div className="max-w-[80%]">
                  <div className="bg-amber-50 border border-amber-200/60 text-gray-600 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[13px] leading-relaxed">
                    <p>
                      Thanks for contacting StudioOS support! We hope
                      your issue has been resolved.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 shrink-0" />
                <div className="max-w-[80%]">
                  <div className="bg-amber-50 border border-amber-200/60 text-gray-600 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[13px] leading-relaxed">
                    <p className="mb-2">
                      Was your question answered or issue resolved?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setClosingFlow("rating")}
                        className="px-4 py-1.5 bg-emerald-500 text-white text-xs rounded-full hover:bg-emerald-600 transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => {
                          setClosingFlow(null);
                          setChatClosed(false);
                          fetch("/api/support/chat", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                            },
                            body: JSON.stringify({
                              action: "reopen",
                              ticket_id: ticketId,
                            }),
                          }).catch(() => {});
                          setTicket((prev) =>
                            prev
                              ? { ...prev, status: "in_progress" }
                              : prev
                          );
                          resetActivity();
                        }}
                        className="px-4 py-1.5 bg-red-100 text-red-700 text-xs rounded-full hover:bg-red-200 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Closing flow: 1-10 rating */}
          {closingFlow === "rating" && (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 rounded-full bg-[#C9A84C]/10 flex items-center justify-center mt-1 shrink-0">
                <span className="text-[10px]">
                  {"\uD83D\uDCAC"}
                </span>
              </div>
              <div className="max-w-[90%] sm:max-w-[85%]">
                <div className="bg-amber-50 border border-amber-200/60 text-gray-600 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[13px] leading-relaxed">
                  <p className="mb-3">
                    On a scale of 1 to 10, how happy were you with the
                    support?
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          handleRating(n);
                          setClosingFlow("done");
                          setChatClosed(true);
                        }}
                        className={cn(
                          "w-8 h-8 rounded-lg text-xs font-medium transition-all",
                          n <= 3
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : n <= 6
                              ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Closing flow: done */}
          {closingFlow === "done" && (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 rounded-full bg-[#C9A84C]/10 flex items-center justify-center mt-1 shrink-0">
                <span className="text-[10px]">
                  {"\uD83D\uDCAC"}
                </span>
              </div>
              <div className="max-w-[80%]">
                <div className="bg-amber-50 border border-amber-200/60 text-gray-600 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[13px] leading-relaxed">
                  <p>
                    Thanks for the feedback! Have a great day.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Legacy resolved state */}
          {isResolved && !chatClosed && !closingFlow && (
            <div className="mt-4 p-4 bg-gray-100 rounded-xl text-center">
              <p className="text-sm text-gray-400 mb-1">
                This conversation has been resolved.
              </p>
              <button
                onClick={handleReopen}
                className="text-xs text-[#C9A84C] hover:underline mt-1"
              >
                Reopen conversation
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {!isResolved && !chatClosed && !closingFlow && (
        <div className="shrink-0 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-black/[0.08]">
          {/* Escalation button */}
          {!isEscalated && agentRevealed && !sending && (
            <button
              onClick={handleEscalate}
              disabled={escalating}
              className="w-full flex items-center justify-center gap-1.5 text-[11px] text-gray-400 hover:text-red-600 transition-colors mb-2 py-1"
            >
              <AlertTriangle className="w-3 h-3" />
              {escalating
                ? "Escalating..."
                : "Not satisfied? Talk to a supervisor"}
            </button>
          )}
          {isEscalated && (
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-600 mb-2 py-1">
              <AlertTriangle className="w-3 h-3" />
              Escalated to supervisor &mdash; you can still send messages
            </div>
          )}
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                resetActivity();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 outline-none focus:border-[#C9A84C]/50 transition-colors"
              disabled={sending}
              onFocus={resetActivity}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="w-9 h-9 rounded-full bg-[#C9A84C] hover:bg-[#B8973B] disabled:opacity-40 flex items-center justify-center shrink-0 transition-colors"
            >
              {sending ? (
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 text-white" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Closed chat footer */}
      {chatClosed && (
        <div className="shrink-0 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-black/[0.08] text-center">
          <p className="text-xs text-gray-400 mb-2">
            This chat has been closed.
          </p>
          <button
            onClick={onBack}
            className="text-xs text-[#C9A84C] hover:underline font-medium"
          >
            Start a new conversation
          </button>
        </div>
      )}
    </div>
  );
}
