"use client";

import { ReactNode } from "react";
import {
  LayoutDashboard, Calendar, DollarSign, Users, Monitor,
  Search, Bell, MessageSquare, Settings, CreditCard,
  Play, Shield, HelpCircle, Sparkles, Clock, Home, Check, X,
  AlertTriangle, Star, Eye, Database,
  LucideIcon
} from "lucide-react";

function Section({ id, title, icon: Icon, badge, children }: { id: string; title: string; icon: LucideIcon; badge?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 mb-16">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.06]">
        <div className="w-10 h-10 bg-[#C9A84C]/10 rounded-xl flex items-center justify-center border border-[#C9A84C]/20">
          <Icon className="w-5 h-5 text-[#C9A84C]" />
        </div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-white tracking-tight">{title}</h2>
          {badge}
        </div>
      </div>
      <div className="prose prose-invert max-w-none space-y-5">
        {children}
      </div>
    </section>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-[#A8A49A]/70 text-sm leading-relaxed">{children}</p>;
}

function H3({ children }: { children: ReactNode }) {
  return <h3 className="text-lg font-medium text-white mt-8 mb-3">{children}</h3>;
}

function Note({ type = "info", children }: { type?: "info" | "warning" | "tip"; children: ReactNode }) {
  const styles: Record<string, string> = {
    info: "bg-blue-500/[0.06] border-blue-500/15 text-blue-400",
    warning: "bg-amber-500/[0.06] border-amber-500/15 text-amber-400",
    tip: "bg-emerald-500/[0.06] border-emerald-500/15 text-emerald-400",
  };
  const icons: Record<string, LucideIcon> = { info: AlertTriangle, warning: AlertTriangle, tip: Star };
  const IconComp = icons[type];
  return (
    <div className={`rounded-xl border p-4 ${styles[type]}`}>
      <div className="flex items-start gap-2.5">
        <IconComp className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="text-sm leading-relaxed opacity-80">{children}</div>
      </div>
    </div>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5 my-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <Check className="w-4 h-4 text-[#C9A84C] shrink-0 mt-0.5" />
          <span className="text-sm text-[#A8A49A]/60 leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = { Starter: "bg-[#A8A49A]/15 text-[#A8A49A]", Pro: "bg-[#C9A84C]/15 text-[#C9A84C]", Elite: "bg-purple-500/15 text-purple-400" };
  return <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${colors[plan] || colors.Starter}`}>{plan}</span>;
}

function PlanRequirement({ plan, label }: { plan: string; label?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <PlanBadge plan={plan} />
      {label && <span className="text-xs text-[#A8A49A]/30">{label}</span>}
    </div>
  );
}

function RoleTable() {
  const roles = [
    { role: "Owner", desc: "Full access to everything — billing, settings, user management, all features. One owner per studio.", color: "text-[#C9A84C]" },
    { role: "Admin", desc: "Same as Owner minus billing management. Can manage users, shifts, earnings, and all features.", color: "text-[#C9A84C]" },
    { role: "Operator", desc: "Manages assigned models. Can view and create shifts, enter earnings, use team chat, and monitor live streams.", color: "text-amber-400" },
    { role: "Model", desc: "Views own schedule, earnings, and stream stats. Can request shift changes and use team chat.", color: "text-emerald-400" },
    { role: "Accountant", desc: "View-only access to earnings, payouts, and financial reports. No operational access.", color: "text-blue-400" },
  ];
  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden my-4">
      {roles.map((r, i) => (
        <div key={i} className={`flex items-start gap-4 p-4 ${i > 0 ? "border-t border-white/[0.04]" : ""}`}>
          <div className="w-24 shrink-0">
            <span className={`text-sm font-medium ${r.color}`}>{r.role}</span>
          </div>
          <p className="text-sm text-[#A8A49A]/50 leading-relaxed">{r.desc}</p>
        </div>
      ))}
    </div>
  );
}

function StepList({ steps }: { steps: { title: string; desc: string }[] }) {
  return (
    <div className="space-y-4 my-4">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-4">
          <div className="w-7 h-7 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-[#C9A84C]">{i + 1}</span>
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-sm text-white font-medium mb-1">{step.title}</p>
            <p className="text-sm text-[#A8A49A]/50 leading-relaxed">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HelpCenterContent({ activeSection }: { activeSection: string }) {
  return (
    <div className="max-w-3xl">
      {/* Overview */}
      {activeSection === "overview" && (
        <Section id="overview" title="Platform Overview" icon={Home}>
          <P>StudioOS is the leading management platform built exclusively for webcam studios. It centralizes shift scheduling, automated stream tracking, earnings management, payouts, team communication, and AI-powered performance analytics — all from one unified dashboard.</P>

          <H3>What StudioOS Does</H3>
          <FeatureList items={[
            "Automated stream time tracking across 8 cam platforms — MyFreeCams, Chaturbate, StripChat, BongaCams, Cam4, CamSoda, Flirt4Free, LiveJasmin",
            "Visual shift scheduling with calendar view, shift requests, and approval workflows",
            "Earnings tracking with per-platform token-to-USD conversion and multi-currency support",
            "Automatic payout calculations with configurable model and operator cut percentages",
            "AI-powered Model Insights with deterministic performance scoring and coaching recommendations",
            "Model Lookup — search any cam model by username across all major platforms and view stats, sessions, tips, top members, and chat history",
            "Member Lookup — search cam site members and view their public tipping history and spending patterns",
            "Member Alerts — get instant Telegram notifications when high-spending members enter your monitored rooms",
            "Real-time live stream monitoring showing which models are online and in what show type",
            "Built-in team chat with role-based channels",
            "Multi-currency support with configurable exchange rates",
            "Room management for physical streaming rooms",
            "Comprehensive audit log with Google Sheets integration",
            "Data backup and export functionality",
          ]} />

          <H3>What StudioOS Does NOT Do</H3>
          <ul className="space-y-2.5 my-4">
            {[
              "StudioOS does not stream on behalf of your models — it only tracks and monitors streams",
              "StudioOS does not access or log into your cam site accounts — stream data is fetched from public APIs",
              "StudioOS does not process payouts — it calculates amounts; actual payments are made by the studio",
              "StudioOS does not provide tax or legal advice — earnings reports are for internal studio management only",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <X className="w-4 h-4 text-red-400/60 shrink-0 mt-0.5" />
                <span className="text-sm text-[#A8A49A]/50 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>

          <H3>Supported Cam Platforms</H3>
          <P>StudioOS supports stream tracking and earnings for the following cam sites:</P>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
            {[
              { name: "MyFreeCams", color: "#006E00" },
              { name: "Chaturbate", color: "#F47421" },
              { name: "StripChat", color: "#A2242D" },
              { name: "BongaCams", color: "#A02239" },
              { name: "Cam4", color: "#FF6B00" },
              { name: "CamSoda", color: "#01B0FA" },
              { name: "Flirt4Free", color: "#E91E63" },
              { name: "LiveJasmin", color: "#BA0000" },
            ].map(p => (
              <div key={p.name} className="px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white text-center flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                {p.name}
              </div>
            ))}
          </div>
        </Section>
      )}

      {activeSection === "registration" && (
        <Section id="registration" title="Registration & Setup" icon={Play}>
          <P>Getting started with StudioOS takes just a few minutes. Here&apos;s the complete setup flow.</P>

          <StepList steps={[
            { title: "Create Your Account", desc: "Visit the landing page and click \"Start Free Trial\". Enter your name, email, password (minimum 8 characters), and studio name. Accept the Terms of Service and Privacy Policy." },
            { title: "Verify Your Email", desc: "We send a verification email to activate your account. Click the link within 24 hours. Check your spam folder if you don't see it." },
            { title: "Start Your 7-Day Free Trial", desc: "Every new studio gets a 7-day free trial with full access to your selected plan tier. No credit card required during the trial." },
            { title: "Set Up Your Studio", desc: "Go to Users to add your team — models, operators, and accountants. For each model, add their cam accounts (platform + username) to start tracking stream time automatically." },
            { title: "Configure Settings", desc: "Go to Settings to customize token-to-USD conversion rates, secondary currency, payout frequency, and studio timezone." },
          ]} />

          <H3>Historical Data</H3>
          <P>When you add a cam account for a model, StudioOS automatically fetches up to 30 days of historical streaming data from public APIs. This process takes approximately 20–30 minutes per account. You&apos;ll receive an email notification once the data fetch is complete, and the data will immediately appear in Stream Time and Model Insights.</P>

          <Note type="info">The 7-day trial is managed inside StudioOS. When you subscribe via Stripe checkout, payment starts immediately — there is no additional trial period on top of the Stripe subscription.</Note>
        </Section>
      )}

      {activeSection === "roles" && (
        <Section id="roles" title="Roles & Permissions" icon={Shield}>
          <P>StudioOS has five distinct roles, each with specific access levels to ensure data isolation and security across your team.</P>
          <RoleTable />

          <H3>&ldquo;Works Alone&rdquo; Mode</H3>
          <P>Models can be flagged as &ldquo;Works Alone&rdquo; in their profile. This allows them to manage their own shifts directly without needing an operator assignment — useful for independent models within your studio.</P>

          <H3>Password Management</H3>
          <P>Admins and owners can reset passwords for any team member from the Users tab (Edit &rarr; Reset Password). If an admin or owner forgets their own password, they can use the &ldquo;Forgot Password&rdquo; link on the sign-in page to receive a temporary password via email. Models and operators must contact their studio admin for password resets.</P>
          <Note type="tip">After receiving a temporary password, sign in and immediately change it from the Users tab to keep your account secure.</Note>
        </Section>
      )}

      {activeSection === "dashboard" && (
        <Section id="dashboard" title="Dashboard" icon={LayoutDashboard}>
          <P>The dashboard is the first screen you see after logging in. It&apos;s tailored to each role, showing only the most relevant information.</P>

          <H3>Admin / Owner Dashboard</H3>
          <P>A complete studio overview including today&apos;s revenue, total models currently online, pending shift approvals, weekly earnings charts, and the live stream monitor. Use the date range selector to filter data across any period. Quick-access cards link to key management areas.</P>

          <H3>Operator Dashboard</H3>
          <P>Shows your assigned models&apos; shifts for today, their current stream status across platforms, and any pending tasks or shift change requests requiring your attention.</P>

          <H3>Model Dashboard</H3>
          <P>Displays your upcoming shifts, personal stream time stats, and your earnings summary. Models see only their own data — never other models&apos; information.</P>

          <H3>Accountant Dashboard</H3>
          <P>Focused exclusively on financial data: total studio revenue, pending payouts, and earnings breakdowns by model and platform.</P>
        </Section>
      )}

      {activeSection === "schedule" && (
        <Section id="schedule" title="Shift Scheduling" icon={Calendar}>
          <P>The scheduling system provides a visual calendar interface for planning and managing model shifts with full approval workflows.</P>

          <H3>Creating Shifts</H3>
          <P>Admins and operators can create shifts by selecting a date, time range, model, operator, and room. Shifts appear on a weekly calendar with colour-coded status indicators for instant visual clarity.</P>

          <H3>Shift Statuses</H3>
          <FeatureList items={[
            "Scheduled — upcoming shift, not yet started",
            "Completed — shift finished normally",
            "No Show — model did not appear for their shift",
            "Cancelled — shift was cancelled before starting",
            "Pending Approval — a shift or shift change has been requested and awaits admin review",
          ]} />

          <H3>Shift Requests</H3>
          <P>Models can request new shifts or request changes to existing ones. These requests appear in the admin&apos;s pending approvals queue and can be approved or rejected. Models flagged as &ldquo;Works Alone&rdquo; can create and manage their own shifts directly.</P>

          <H3>Shift Change Requests</H3>
          <P>Any team member can request a modification to an existing shift — time change, room change, or operator reassignment. The request displays old vs. new data side by side for easy comparison before approval.</P>
        </Section>
      )}

      {activeSection === "streamtime" && (
        <Section id="streamtime" title="Stream Time Tracking" icon={Clock}>
          <PlanRequirement plan="Starter" label="Available on all paid plans" />
          <P>StudioOS automatically tracks how long each model streams across all their connected cam platforms — no manual input required.</P>

          <H3>How It Works</H3>
          <P>When you add a cam account (platform + username) for a model, StudioOS checks public API data at regular intervals to detect when the model goes online, what type of show they&apos;re in, and when they go offline. This creates a detailed streaming timeline.</P>

          <H3>Show Types Tracked</H3>
          <P>StudioOS recognises and categorises the following show types:</P>
          <FeatureList items={[
            "Free Chat — open public chat room",
            "Private Chat — one-on-one private show",
            "Nude Chat — nude-enabled show type",
            "Member Chat — member/fan club exclusive chat",
            "Group Chat — group shows with multiple viewers",
            "Semi-Private — semi-private show mode",
            "VIP Chat — VIP-exclusive chat room",
            "Happy Hour — discounted show mode",
            "Party Chat — party/celebration show type",
            "Gold Show / Pre-Gold — gold show and pre-show lobby",
            "True Private — fully private, no spy mode",
            "Paid Chat — general paid chat mode",
            "Away / On Break — model is set to away status",
            "Offline — model is not streaming",
          ]} />

          <H3>Cross-Platform Overlap Detection</H3>
          <P>If a model streams on multiple platforms simultaneously, StudioOS detects the overlap and calculates &ldquo;unique minutes&rdquo; — the actual time spent streaming with duplicates removed. This gives you accurate totals across all platforms.</P>

          <H3>Daily Stats Table</H3>
          <P>The Stream Time page shows a daily breakdown with total minutes per platform, show type splits (public/private/group), away time, and estimated earnings when token rates are configured in settings.</P>

          <Note type="info">Stream data comes from public APIs. StudioOS never logs into cam site accounts or accesses private dashboards — only publicly available streaming status data is used.</Note>
        </Section>
      )}

      {activeSection === "accounting" && (
        <Section id="accounting" title="Earnings & Accounting" icon={DollarSign}>
          <P>Earnings are entered manually by operators or admins after each shift is completed. This is by design — cam site dashboards are the only source of accurate token counts, so manual entry ensures precision.</P>

          <H3>How Earnings Work</H3>
          <P>Each earning record is linked to a specific shift. The operator enters token amounts earned on each platform during that shift. StudioOS automatically converts tokens to USD using configured rates, then calculates model pay and operator pay based on their individual cut percentages.</P>

          <H3>Token-to-USD Conversion</H3>
          <P>Each cam platform has a different token-to-USD rate. Default rates are pre-configured but fully adjustable in Settings:</P>
          <div className="grid grid-cols-2 gap-2 my-4">
            {[
              { site: "Chaturbate", rate: "$0.05/token" },
              { site: "StripChat", rate: "$0.05/token" },
              { site: "MyFreeCams", rate: "$0.05/token" },
              { site: "CamSoda", rate: "$0.05/token" },
              { site: "BongaCams", rate: "$0.02/token" },
              { site: "Flirt4Free", rate: "$0.03/credit" },
              { site: "Cam4", rate: "$0.10/token" },
              { site: "LiveJasmin", rate: "$1.00/credit" },
            ].map(s => (
              <div key={s.site} className="flex justify-between px-3 py-2 bg-white/[0.03] rounded-lg border border-white/[0.04]">
                <span className="text-xs text-white">{s.site}</span>
                <span className="text-xs text-[#C9A84C] font-medium">{s.rate}</span>
              </div>
            ))}
          </div>

          <H3>OnlyFans Earnings</H3>
          <P>StudioOS also supports tracking OnlyFans earnings. Enter gross and net USD amounts directly — no token conversion needed since OnlyFans works in USD.</P>

          <H3>Multi-Currency Support</H3>
          <PlanRequirement plan="Elite" />
          <P>Studios can configure a secondary currency (e.g. HUF, EUR, GBP) with either a manual or automatic exchange rate. All earnings are then displayed in both USD and the secondary currency throughout the entire platform.</P>

          <Note type="warning">Earnings are NOT automatically pulled from cam sites. They must be manually entered after each shift. This is because only the studio (via each platform&apos;s dashboard) knows the exact token counts for each session.</Note>
        </Section>
      )}

      {activeSection === "payouts" && (
        <Section id="payouts" title="Payouts" icon={CreditCard}>
          <P>The payouts system automatically calculates what each model and operator should be paid based on recorded earnings and their configured cut percentages.</P>

          <H3>How Payouts Are Calculated</H3>
          <P>For each earning record, StudioOS calculates:</P>
          <FeatureList items={[
            "Model Pay = Total Gross x Model Cut %",
            "Operator Pay = Total Gross x Operator Cut %",
            "Studio Profit = the remaining amount after model and operator cuts",
          ]} />

          <H3>Payout Methods</H3>
          <P>Each user can be assigned a preferred payout method — currently Bank Transfer or Cash. This is configured in the user&apos;s profile and displayed on payout reports for easy reference.</P>

          <H3>Payout Periods</H3>
          <P>Studios can configure their payout frequency in Settings: weekly, biweekly, or monthly. The Payouts page shows summaries grouped by period with status tracking — pending, processing, paid, or failed.</P>
        </Section>
      )}

      {activeSection === "modelinsights" && (
        <Section id="modelinsights" title="Model Insights & AI" icon={Sparkles}>
          <PlanRequirement plan="Starter" label="Available on all paid plans" />
          <P>Model Insights is an advanced analytics dashboard providing deep visibility into each model&apos;s performance with AI-powered coaching recommendations.</P>

          <H3>Available Analytics</H3>
          <FeatureList items={[
            "Revenue Area Chart — daily and weekly earnings trends over customisable time periods",
            "Earnings Per Hour — weekly revenue efficiency measured in $/hour",
            "Site Breakdown — revenue contribution by platform with percentages and visual bars",
            "Show Type Breakdown — pie chart of streaming time split across public, private, group, and other show types",
            "Stream Heatmap — visual heatmap showing streaming hours by day of the week and time of day",
            "Best Times Chart — identifies which days and time slots generate the most private shows",
            "Revenue Scatter Plot — correlation analysis between hours streamed and earnings generated",
            "Stat Tiles — key metrics at a glance including total revenue, hours streamed, $/hour, and trend direction",
          ]} />

          <H3>AI Performance Coach</H3>
          <P>The AI Performance Coach analyses all available data and provides actionable recommendations. It calculates a deterministic performance score (0–100) based on five weighted categories:</P>
          <div className="space-y-2.5 my-4">
            {[
              { cat: "Schedule Consistency", pts: "0–25 pts", desc: "How regularly the model streams on the same days each week" },
              { cat: "Private Show Mix", pts: "0–25 pts", desc: "Private show ratio vs. industry benchmarks (25–40% ideal)" },
              { cat: "Streaming Volume", pts: "0–20 pts", desc: "Weekly hours vs. optimal range (20–35 hrs/week)" },
              { cat: "Revenue Efficiency", pts: "0–20 pts", desc: "Dollars earned per hour streamed" },
              { cat: "Earning Trend", pts: "0–10 pts", desc: "Whether revenue is improving, stable, or declining" },
            ].map((c, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                <span className="text-xs text-[#C9A84C] font-bold whitespace-nowrap">{c.pts}</span>
                <div>
                  <p className="text-sm text-white font-medium">{c.cat}</p>
                  <p className="text-xs text-[#A8A49A]/40 mt-0.5">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <P>The AI provides platform-specific tactical advice, a recommended weekly schedule, and prioritised action items. The score is consistent and data-driven — it will not change between refreshes unless the underlying data changes.</P>
          <Note type="info">If a model has no earnings data yet, the AI focuses on streaming patterns and schedule optimisation only. Earnings-based insights appear once earnings are entered for that model.</Note>
        </Section>
      )}

      {activeSection === "modellookup" && (
        <Section id="modellookup" title="Model Lookup" icon={Eye}>
          <PlanRequirement plan="Pro" label="Available on Pro and Elite plans" />
          <P>Search any cam model by username across all major platforms to view comprehensive statistics, streaming sessions, tipping data, top members, chat history, and profile images.</P>

          <H3>Supported Platforms</H3>
          <P>Model Lookup works across Chaturbate, StripChat, BongaCams, CamSoda, MyFreeCams, and LiveJasmin.</P>

          <H3>Available Data</H3>
          <FeatureList items={[
            "Stats — ranking history, income trends, and hourly activity heatmaps",
            "Sessions — detailed streaming session log with start/end times and durations",
            "Timeline — visual timeline of streaming activity over the selected date range",
            "Tips — full tipping history with amounts and timestamps",
            "Top Members — highest-spending members for this model with total amounts",
            "Chat — public chat message history with search functionality",
            "Profile — profile images and similar models on the same platform",
          ]} />

          <H3>Date Range Filtering</H3>
          <P>All data tabs support custom date range filtering. Use the preset buttons (7d, 14d, 30d, 90d) or pick custom start and end dates. The model&apos;s summary stats at the top always reflect the selected range.</P>

          <Note type="warning">
            <strong>Important:</strong> Tipping and income data reflects <strong>public tips only</strong> — tips made in the public chat room. Tips from private shows, group shows, and anonymous/secret tips are not included.
          </Note>
        </Section>
      )}

      {activeSection === "memberlookup" && (
        <Section id="memberlookup" title="Member Lookup" icon={Search}>
          <PlanRequirement plan="Pro" label="Available on Pro and Elite plans" />
          <P>Search cam site members by their exact username to view their complete public tipping history, spending patterns, top models tipped, and chat activity across platforms.</P>

          <H3>Supported Platforms</H3>
          <P>Member Lookup works across Chaturbate, StripChat, BongaCams, CamSoda, MyFreeCams, and LiveJasmin.</P>

          <H3>Available Data</H3>
          <FeatureList items={[
            "All-time total tipped amount in USD",
            "Daily token spending chart over time",
            "Top models tipped with total amounts per model",
            "Detailed tipping history with timestamps and amounts",
            "Chat message history across rooms",
            "Activity chart showing when the member is most active",
            "Date range filtering for all data views",
          ]} />

          <Note type="warning">
            <strong>Important:</strong> The tipping data shown reflects <strong>public tips only</strong> — tips made in the public chat room. Tips from private shows, group shows, spy shows, and anonymous/secret tips are not included in these numbers.
          </Note>
        </Section>
      )}

      {activeSection === "memberalerts" && (
        <Section id="memberalerts" title="Member Alerts" icon={Bell}>
          <PlanRequirement plan="Elite" />
          <P>Get instant Telegram notifications when high-spending members enter your monitored rooms. Stay informed about valuable visitors to maximise engagement and revenue.</P>

          <H3>How It Works</H3>
          <P>StudioOS monitors your configured rooms in real-time. When a member enters one of your rooms, it automatically checks their all-time public spending history. If their spending exceeds your configured threshold, you instantly receive a Telegram notification with a detailed breakdown.</P>

          <H3>Setup</H3>
          <StepList steps={[
            { title: "Connect Telegram", desc: "Click the \"Connect Telegram Bot\" button on the Member Alerts page. You'll be redirected to Telegram to start the bot — no codes or manual steps required." },
            { title: "Add Rooms to Monitor", desc: "Enter the model's cam username for each room you want to track." },
            { title: "Select Platforms", desc: "Choose which cam sites to monitor per room — MyFreeCams, StripChat, BongaCams, Chaturbate, LiveJasmin, and CamSoda." },
            { title: "Set Spending Threshold", desc: "Configure a minimum spending amount (e.g. $400). Only members with all-time spending above this trigger an alert. Set to $0 to receive alerts for every entering member." },
          ]} />

          <Note type="warning">
            <strong>Beta platforms:</strong> Chaturbate, LiveJasmin, and CamSoda are currently in beta for Member Alerts. Approximately 20% of joining members are analysed and filtered on these platforms. MyFreeCams, StripChat, and BongaCams have full coverage.
          </Note>

          <H3>Alert Details</H3>
          <P>Each Telegram notification includes:</P>
          <FeatureList items={[
            "Site and room name where the member was detected",
            "Member username",
            "All-time total public spending in USD",
            "Spending over the last 3 months",
            "Spending over the last month",
            "Your configured alert threshold for reference",
          ]} />

          <Note type="warning">
            <strong>Important:</strong> Spending data reflects <strong>public tips only</strong>. Tips from private shows, group shows, spy shows, and anonymous/secret tips are not included in spending calculations.
          </Note>
        </Section>
      )}

      {activeSection === "livemonitor" && (
        <Section id="livemonitor" title="Live Stream Monitor" icon={Monitor}>
          <PlanRequirement plan="Starter" label="Available on all paid plans" />
          <P>The Live Stream Monitor provides a real-time overview of all your studio&apos;s models and their current streaming status. At a glance, you can see who is online, which platform they&apos;re streaming on, what type of show they&apos;re in, and how long they&apos;ve been live.</P>
          <P>The monitor refreshes automatically and is displayed as a widget on the Dashboard for admins and operators. Each model card shows their current platform, show type (with colour coding), and live duration.</P>
        </Section>
      )}

      {activeSection === "users" && (
        <Section id="users" title="User Management" icon={Users}>
          <P>Manage your entire studio team from the Users page. Only admins and owners have access to this section.</P>

          <H3>Creating Accounts</H3>
          <P>Click &ldquo;Create New Account&rdquo; and provide email, password, name, role, cut percentage, and preferred payout method. The system enforces your plan&apos;s model limit — you cannot add more models than your plan allows.</P>

          <H3>Model Limits by Plan</H3>
          <div className="grid grid-cols-3 gap-3 my-4">
            {[
              { plan: "Starter", models: "1 model", extra: "+$20/mo each" },
              { plan: "Pro", models: "3 models", extra: "+$15/mo each" },
              { plan: "Elite", models: "5 models", extra: "+$12/mo each" },
            ].map(p => (
              <div key={p.plan} className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-center">
                <PlanBadge plan={p.plan} />
                <p className="text-lg font-semibold text-white mt-3">{p.models}</p>
                <p className="text-[10px] text-[#A8A49A]/40 mt-1">{p.extra}</p>
              </div>
            ))}
          </div>

          <H3>Editing Users</H3>
          <P>Click the edit button on any user to change their role, cut percentage, payout method, or enable &ldquo;Works Alone&rdquo; mode for models. Admins can also reset any user&apos;s password from the edit modal.</P>

          <H3>Cam Accounts</H3>
          <P>For model accounts, an additional &ldquo;Cam Accounts&rdquo; tab lets you add or remove their platform usernames. Adding a cam account automatically triggers a 30-day historical data fetch. You&apos;ll receive an email when the fetch is complete, and the data appears in Stream Time and Model Insights immediately.</P>

          <H3>Deactivating Users</H3>
          <P>Deactivate users by clicking the trash icon. This revokes their login access but preserves all their historical data. The owner account cannot be deactivated.</P>
        </Section>
      )}

      {activeSection === "rooms" && (
        <Section id="rooms" title="Room Management" icon={LayoutDashboard}>
          <P>If your studio has physical streaming rooms, manage them from the Rooms page. Each room can be named, activated or deactivated, and assigned to models via the shift scheduling system.</P>
          <P>Rooms appear as options when creating shifts, helping you track which physical space each model is using for their stream. This is especially useful for studios with multiple rooms to prevent scheduling conflicts.</P>
        </Section>
      )}

      {activeSection === "chat" && (
        <Section id="chat" title="Team Chat" icon={MessageSquare}>
          <P>StudioOS includes built-in team chat with role-based channels, eliminating the need for external messaging apps like WhatsApp or Telegram for internal studio communication.</P>

          <H3>Channel Types</H3>
          <FeatureList items={[
            "General — visible to everyone in the studio",
            "Models Only — only model accounts can view and post messages",
            "Operators Only — only operator accounts can view and post messages",
            "Custom — custom channels created by admins with configurable access",
          ]} />

          <H3>Channel Limits by Plan</H3>
          <div className="grid grid-cols-3 gap-3 my-4">
            {[
              { plan: "Starter", limit: "Not included" },
              { plan: "Pro", limit: "3 channels" },
              { plan: "Elite", limit: "Unlimited" },
            ].map(p => (
              <div key={p.plan} className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-center">
                <PlanBadge plan={p.plan} />
                <p className="text-sm font-medium text-white mt-2">{p.limit}</p>
              </div>
            ))}
          </div>

          <P>Admins can create announcements that are pinned to the top of any channel. File sharing is supported for sharing images, documents, and other files with your team.</P>
        </Section>
      )}

      {activeSection === "billing" && (
        <Section id="billing" title="Billing & Plans" icon={CreditCard}>
          <P>Billing is managed from the Billing page, accessible only to studio owners and admins.</P>

          <H3>Plans</H3>
          <div className="space-y-3 my-4">
            {[
              { name: "Starter", price: "$29/mo", features: ["1 model included", "Auto stream tracking (all 8+ cam sites)", "Shift scheduling & room management", "Earnings & payout tracking", "Model Insights & analytics", "Live stream monitor", "User management", "Data backup & export"] },
              { name: "Pro", price: "$59/mo", features: ["Everything in Starter, plus:", "3 models included (+$15/extra)", "Model & Member Lookup", "Team chat (3 channels)", "Multi-currency support", "Custom studio logo"] },
              { name: "Elite", price: "$99/mo", features: ["Everything in Pro, plus:", "5 models included (+$12/extra)", "Member Alerts (Telegram)", "Accountant role access", "Unlimited chat channels", "Priority support"] },
            ].map(p => (
              <div key={p.name} className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                <div className="flex items-center gap-3 mb-3">
                  <PlanBadge plan={p.name} />
                  <span className="text-sm text-white font-semibold">{p.price}</span>
                </div>
                <ul className="space-y-1.5">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#C9A84C] shrink-0" />
                      <span className="text-xs text-[#A8A49A]/50">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <H3>Billing Cycles</H3>
          <P>Choose between monthly (standard price), quarterly (10% discount), or biannual (20% discount) billing cycles to save on your subscription.</P>

          <H3>Extra Model Seats</H3>
          <P>Need more models than your plan includes? Purchase additional seats: Starter +$20/model/month, Pro +$15/model/month, Elite +$12/model/month. Upgrade or add seats from the Billing page at any time.</P>

          <H3>Managing Your Subscription</H3>
          <P>From the Billing page you can upgrade or downgrade your plan, update your payment method, view invoice history, and access the Stripe customer portal. Cancellations take effect at the end of the current billing period — your access continues until then.</P>

          <Note type="info">You can manage your subscription, update payment methods, and view all past invoices from the Billing page using the &ldquo;Manage Subscription&rdquo; button.</Note>
        </Section>
      )}

      {activeSection === "settings" && (
        <Section id="settings" title="Studio Settings" icon={Settings}>
          <P>Configure your studio&apos;s global preferences from the Settings page (admin and owner only).</P>

          <H3>Available Settings</H3>
          <FeatureList items={[
            "Token-to-USD conversion rates for each of the 8 supported cam platforms",
            "Secondary currency (e.g. HUF, EUR, GBP) with manual or automatic exchange rate updates",
            "Payout frequency — weekly, biweekly, or monthly",
            "Studio timezone for accurate shift and stream time display",
            "Custom studio logo upload (Elite plan only)",
          ]} />
        </Section>
      )}

      {activeSection === "databackup" && (
        <Section id="databackup" title="Data Backup" icon={Database}>
          <P>The Data Backup page allows admins and owners to export studio data for safekeeping or migration.</P>
          <P>You can export your studio&apos;s core data — shifts, earnings, payouts, user accounts, and settings — to keep secure backups of your business records. This is especially useful for regulatory compliance or when transitioning between management systems.</P>
        </Section>
      )}

      {activeSection === "support" && (
        <Section id="support" title="Contact Support" icon={MessageSquare}>
          <P>Need help? Our support team is available via the in-app chat widget. Click the chat bubble icon in the bottom-right corner of any page to start a conversation.</P>

          <H3>How It Works</H3>
          <StepList steps={[
            { title: "Open the Chat Widget", desc: "Click the gold chat bubble icon in the bottom-right corner of any page within StudioOS." },
            { title: "Send Us a Message", desc: "Describe what you need help with. You can optionally include your email for follow-up." },
            { title: "Get a Response", desc: "Our team will review your message and get back to you. We usually reply within an hour." },
            { title: "Track Your Conversations", desc: "All your conversations are saved. Return to the chat widget anytime to continue an existing conversation or start a new one." },
          ]} />

          <H3>Email Support</H3>
          <P>You can also reach us via email at <a href="mailto:support@getstudioos.com" className="text-[#C9A84C] hover:underline">support@getstudioos.com</a>. We typically respond within 24 hours during business days.</P>

          <Note type="tip">For the fastest resolution, use the in-app chat widget — it&apos;s the quickest way to reach us.</Note>
        </Section>
      )}

      {activeSection === "faq" && (
        <Section id="faq" title="Frequently Asked Questions" icon={HelpCircle}>
          {[
            { q: "How does StudioOS track stream time?", a: "StudioOS checks public APIs at regular intervals to detect when models are online and what show type they're in (public, private, group, etc.). No cam site login credentials are required — only publicly available streaming status data is used." },
            { q: "Why do I need to enter earnings manually?", a: "Cam sites do not provide public APIs for earnings or token data. Only the studio (via each platform's dashboard) knows the exact token amounts per session. StudioOS converts your entered token amounts to USD using the rates you configure in Settings." },
            { q: "What happens when my trial ends?", a: "After 7 days, your studio's access is paused until you subscribe. Your data is fully preserved — simply subscribe from the Billing page to reactivate everything instantly." },
            { q: "Can models see other models' earnings?", a: "No. Models can only see their own data. The role-based permission system ensures complete data isolation between all team members." },
            { q: "What if I need more models than my plan includes?", a: "Each plan allows purchasing extra model seats: Starter +$20/model/month, Pro +$15/model/month, Elite +$12/model/month. Add seats from the Billing page at any time." },
            { q: "Is my data secure?", a: "Yes. StudioOS uses encrypted HTTPS connections, secure bcrypt password hashing, session-based authentication with automatic expiry, and role-based access control. We never store cam site login credentials." },
            { q: "What does \"public tips only\" mean?", a: "The Member Lookup, Model Lookup, and Member Alerts features use data from public APIs that only track tips made in the public chat room. Tips from private shows, group shows, spy shows, and anonymous/secret tips are not included in spending calculations." },
            { q: "How accurate is the AI Performance Score?", a: "The performance score is calculated deterministically from your data — schedule consistency, private show ratio, streaming volume, $/hour rate, and earning trends. It won't change between page refreshes unless the underlying data changes." },
            { q: "Can I cancel my subscription?", a: "Yes, cancel anytime from the Billing page. Your subscription remains active until the end of the current billing period, so you won't lose access immediately." },
            { q: "I forgot my password. What do I do?", a: "Admins and owners: use the \"Forgot Password\" link on the sign-in page. A temporary password will be emailed to you. Models and operators: contact your studio admin — they can reset your password from the Users tab." },
            { q: "How long does historical data fetching take?", a: "When you add a cam account for a model, StudioOS fetches up to 30 days of historical stream data. This typically takes 20–30 minutes per account. You'll receive an email notification when it's complete." },
            { q: "Which platforms support Member Alerts?", a: "Member Alerts work with Chaturbate, StripChat, MyFreeCams, CamSoda, BongaCams, and LiveJasmin. Alerts are sent via Telegram when high-spending members enter your monitored rooms." },
          ].map((faq, i) => (
            <div key={i} className={`${i > 0 ? "mt-6 pt-6 border-t border-white/[0.04]" : ""}`}>
              <h3 className="text-sm font-medium text-white mb-2">{faq.q}</h3>
              <p className="text-sm text-[#A8A49A]/50 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}
