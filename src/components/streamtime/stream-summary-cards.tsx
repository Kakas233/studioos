"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Lock, Users, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedNumber from "@/components/shared/animated-number";
import type { LucideIcon } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface StreamSummaryCardsProps {
  stats: any[];
}

export default function StreamSummaryCards({ stats }: StreamSummaryCardsProps) {
  const totals = useMemo(() => {
    let publicMins = 0;
    let privateMins = 0;
    let groupMins = 0;

    for (const s of stats) {
      publicMins += s.free_chat_minutes || s.public_minutes || 0;
      privateMins +=
        (s.private_chat_minutes || 0) +
        (s.nude_chat_minutes || 0) +
        (s.semiprivate_minutes || 0) +
        (s.vip_chat_minutes || 0) +
        (s.true_private_minutes || 0) +
        (s.paid_chat_minutes || 0);
      if (s.private_chat_minutes === undefined && s.private_minutes)
        privateMins += s.private_minutes;
      groupMins +=
        (s.member_chat_minutes || 0) +
        (s.group_chat_minutes || 0) +
        (s.happy_hour_minutes || 0) +
        (s.party_chat_minutes || 0) +
        (s.pre_gold_show_minutes || 0) +
        (s.gold_show_minutes || 0);
      if (s.member_chat_minutes === undefined && s.group_minutes)
        groupMins += s.group_minutes;
    }

    const uniqueByModelDate: Record<string, number> = {};
    for (const s of stats) {
      const key = `${s.model_id}_${s.date}`;
      if (
        !uniqueByModelDate[key] ||
        (s.unique_minutes || 0) > uniqueByModelDate[key]
      ) {
        uniqueByModelDate[key] = s.unique_minutes || 0;
      }
    }
    const uniqueOnline = Object.values(uniqueByModelDate).reduce(
      (a, b) => a + b,
      0
    );

    return { uniqueOnline, publicMins, privateMins, groupMins };
  }, [stats]);

  const cards: {
    label: string;
    value: number;
    icon: LucideIcon;
    color: string;
    bg: string;
    ring: string;
  }[] = [
    {
      label: "Unique Online Time",
      value: totals.uniqueOnline,
      icon: Wifi,
      color: "text-[#C9A84C]",
      bg: "bg-[#C9A84C]/10",
      ring: "hover:ring-[#C9A84C]/10",
    },
    {
      label: "Free Chat",
      value: totals.publicMins,
      icon: Eye,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      ring: "hover:ring-emerald-500/10",
    },
    {
      label: "Private Shows",
      value: totals.privateMins,
      icon: Lock,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      ring: "hover:ring-purple-500/10",
    },
    {
      label: "Group Shows",
      value: totals.groupMins,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      ring: "hover:ring-blue-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: i * 0.05,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <Card
            className={`bg-[#111111]/80 border-white/[0.04] hover:border-white/[0.08] transition-all hover:ring-1 ${card.ring}`}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div
                className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}
              >
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs text-[#A8A49A]/40">{card.label}</p>
                <p className={`text-xl font-bold ${card.color}`}>
                  <AnimatedNumber
                    value={Math.floor(card.value / 60)}
                    formatter={(v) => `${Math.round(v)}h`}
                  />{" "}
                  <AnimatedNumber
                    value={Math.round(card.value % 60)}
                    formatter={(v) => `${Math.round(v)}m`}
                  />
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
