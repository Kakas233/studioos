"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

function Accordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left group"
    >
      <div className="flex items-start justify-between gap-4 py-4 border-b border-white/[0.04]">
        <span className="text-[13px] text-white/90 font-medium leading-relaxed group-hover:text-white transition-colors">
          {item.q}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-white/20 shrink-0 mt-0.5 transition-transform duration-200 ${
            open ? "rotate-180 text-[#C9A84C]" : ""
          }`}
        />
      </div>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? "max-h-[500px] pb-4" : "max-h-0"
        }`}
      >
        <p className="text-[13px] text-[#A8A49A]/60 leading-relaxed pt-2 pr-8">
          {item.a}
        </p>
      </div>
    </button>
  );
}

const ownerAdminFAQ: FAQSection[] = [
  {
    title: "Getting Started",
    items: [
      {
        q: "How do I add a new model to StudioOS?",
        a: "Go to Users → click Add User → select the \"Model\" role. Fill in their name and email — they'll receive an invite to create their account. Once added, go to their profile and link their cam accounts (platform + username) so stream tracking starts automatically.",
      },
      {
        q: "How does automatic stream tracking work?",
        a: "Once you link a model's cam account (e.g., Chaturbate / username), StudioOS automatically fetches their streaming data every 15 minutes. It tracks when they're online, what show types they're in, and for how long. Historical data (up to 30 days) is fetched when you first add the account.",
      },
      {
        q: "What cam platforms are supported?",
        a: "StudioOS supports 8 platforms: MyFreeCams, Chaturbate, StripChat, BongaCams, Cam4, CamSoda, Flirt4Free, and LiveJasmin. A model can have accounts on multiple platforms simultaneously.",
      },
      {
        q: "How do I set up rooms?",
        a: "Go to Rooms → Add Room. Rooms represent physical streaming rooms in your studio. You can assign models to rooms, which helps with shift scheduling — the system prevents double-booking the same room.",
      },
    ],
  },
  {
    title: "Earnings & Financials",
    items: [
      {
        q: "How are token values converted to USD?",
        a: "Each platform has a different token-to-USD rate. Go to Settings → Token Rates to see and customize them. Defaults: MyFreeCams $0.05, Chaturbate $0.05, StripChat $0.05, CamSoda $0.05, BongaCams $0.02, Cam4 $0.10, Flirt4Free $0.03, LiveJasmin $1.00 per token.",
      },
      {
        q: "How do payouts work?",
        a: "Payouts are calculated based on each model's cut percentage (set in their user profile). Go to Payouts to see calculated amounts per model for any date range. The system uses the earnings data entered in the Accounting section.",
      },
      {
        q: "Can I use a secondary currency alongside USD?",
        a: "Yes. Go to Settings → Currency and select your secondary currency (e.g., EUR, HUF, GBP). Set the exchange rate, and all financial views will show both USD and your secondary currency.",
      },
      {
        q: "How do I enter earnings manually?",
        a: "Go to Accounting → Add Entry. Select the model, date, and enter token amounts per platform. The system auto-calculates USD values using your configured token rates and splits the earnings based on the model's cut percentage.",
      },
    ],
  },
  {
    title: "Scheduling",
    items: [
      {
        q: "How does shift scheduling work?",
        a: "Go to Schedule to see a weekly calendar view. Click any time slot to create a shift — select the model, room, and time range. Models and operators can see their assigned shifts. The system checks for room conflicts automatically.",
      },
      {
        q: "What are shift requests?",
        a: "Models can request specific shift times. These appear in your notification area as pending requests. You can approve or reject them, and if approved, the shift is added to the schedule automatically.",
      },
      {
        q: "How does shift adherence tracking work?",
        a: "StudioOS compares scheduled shift times against actual streaming data. It calculates adherence percentage, late starts, early ends, and break time. This data appears in Model Insights so you can see which models stick to their schedules.",
      },
    ],
  },
  {
    title: "Analytics & Intelligence",
    items: [
      {
        q: "What does Model Insights show?",
        a: "Model Insights gives you per-model analytics: revenue trends, stream time charts, best performing hours (heatmap), show type breakdown, platform comparison, and AI-powered recommendations for optimizing streaming schedules.",
      },
      {
        q: "How does Model Lookup work?",
        a: "Model Lookup lets you search any cam model (not just yours) across all 8 platforms. It pulls public stats like online hours, show type distribution, schedule patterns, and similar model suggestions. Useful for scouting and competitive research.",
      },
      {
        q: "What are Member Alerts?",
        a: "Member Alerts track specific viewers across platforms. Set a spending threshold, and you'll get notified (via Telegram) when that member tips above your threshold or goes online in one of your model's rooms. Great for tracking high-value regulars.",
      },
      {
        q: "How do I connect Telegram for alerts?",
        a: "Go to Member Alerts → Connect Telegram Bot. Click the button, open the link in Telegram, and press Start. The connection is confirmed automatically within a few seconds. You can test it with the \"Send Test\" button.",
      },
      {
        q: "What data is available for Model Lookup, Member Lookup, and Member Alerts?",
        a: "These features use Statbate as a data source, so the available historical data depends on what Statbate has collected per platform. Tips data: Chaturbate, Stripchat, and Bongacams from November 2023, Camsoda from January 2024, MyFreeCams from December 2024, LiveJasmin from February 2026. Chat messages: Chaturbate from July 2024, Stripchat and MyFreeCams from December 2024, Bongacams and Camsoda from August 2025, LiveJasmin from February 2026. Session data: Chaturbate from March 2021, Stripchat, Bongacams, Camsoda, and MyFreeCams from December 2025, LiveJasmin from February 2026. Data before these dates is not available for the respective platforms.",
      },
    ],
  },
  {
    title: "Account & Billing",
    items: [
      {
        q: "What's included in each plan?",
        a: "Starter ($29/mo): 1 model, core features. Pro ($59/mo): up to 3 models, Model Insights, Member Alerts. Elite ($99/mo): up to 5 models, all features including Model Lookup, Member Lookup, and priority support. Extra models can be added for $15/mo each.",
      },
      {
        q: "How do I add more models beyond my plan limit?",
        a: "Go to Billing → Add Extra Models. Each additional model is $15/month, added to your existing subscription. You can remove extra model slots at any time.",
      },
      {
        q: "How do I manage user roles?",
        a: "Go to Users → click the edit icon on any user. Roles: Owner (full access, one per studio), Admin (full access except billing), Operator (manages assigned models' shifts and earnings), Model (views own data only), Accountant (financial data only).",
      },
      {
        q: "How do I export my data?",
        a: "Go to Data Backup → Export. You can export earnings, shifts, stream stats, and audit logs as CSV files. We recommend exporting weekly as a backup.",
      },
    ],
  },
];

const operatorFAQ: FAQSection[] = [
  {
    title: "Your Role",
    items: [
      {
        q: "What can I do as an Operator?",
        a: "You manage the day-to-day for your assigned models: schedule their shifts, enter their earnings after each session, monitor their stream time, and communicate via team chat. You can only see data for models assigned to you.",
      },
      {
        q: "How do I see which models are assigned to me?",
        a: "Your Dashboard shows only your assigned models. You'll see their live status, upcoming shifts, and recent earnings. If you think a model is missing, ask your studio admin to check your assignments.",
      },
    ],
  },
  {
    title: "Scheduling Shifts",
    items: [
      {
        q: "How do I schedule a shift for my model?",
        a: "Go to Schedule → click on a time slot → select the model and time range. The room is automatically assigned based on the model's profile. You'll see conflicts highlighted if the room or model is already booked.",
      },
      {
        q: "Can I edit or cancel a shift?",
        a: "You can edit upcoming shifts freely. To change a past shift, submit an edit — it will go to your admin for approval. Only admins can cancel shifts entirely; you can mark a shift as \"No Show\" if the model didn't come in.",
      },
      {
        q: "Can I see other operators' shifts?",
        a: "You can see that a room or time slot is booked, but you won't see the details of other operators' models. This protects model privacy across different operators in the same studio.",
      },
    ],
  },
  {
    title: "Earnings & Stream Time",
    items: [
      {
        q: "How do I enter earnings for a shift?",
        a: "Go to Accounting → Add Entry. Select the model, choose the date, and enter the token amounts per platform. The system automatically converts tokens to USD and calculates the studio/model split based on the model's cut percentage.",
      },
      {
        q: "Where can I see my models' stream time?",
        a: "Go to Stream Time to see a breakdown of online hours per model, including show types (free chat, private, group, etc.). This data is pulled automatically from cam platforms — you don't need to enter it manually.",
      },
      {
        q: "What does the revenue shown in my dashboard mean?",
        a: "Your dashboard shows the total revenue generated by your assigned models, not your personal pay. Your admin sets compensation separately. The earnings here reflect what your models brought in during the selected period.",
      },
      {
        q: "What historical data is available for lookup features?",
        a: "Model Lookup and Member Lookup use Statbate data. Tips data goes back to November 2023 for Chaturbate, Stripchat, and Bongacams, January 2024 for Camsoda, December 2024 for MyFreeCams, and February 2026 for LiveJasmin. Session data goes back to March 2021 for Chaturbate and December 2025 for most other platforms. Chat messages go back to July 2024 for Chaturbate. Data before these dates is not available.",
      },
    ],
  },
];

const modelFAQ: FAQSection[] = [
  {
    title: "Your Dashboard",
    items: [
      {
        q: "What do the numbers on my dashboard mean?",
        a: "Your dashboard shows your personal stats: total earnings (your cut after the studio split), stream time this period, upcoming shifts, and your weekly goal progress if enabled. All amounts shown are your take-home portion.",
      },
      {
        q: "How is my stream time tracked?",
        a: "StudioOS automatically tracks your streaming time across all your linked cam accounts. It knows when you go online, what show type you're in, and for how long. You don't need to log anything manually.",
      },
      {
        q: "Why does my earnings amount look different from what I see on the cam site?",
        a: "Your dashboard shows your net payout — after the studio's cut. For example, if you earned 1000 tokens on Chaturbate ($50) and your cut is 60%, your dashboard shows $30. The raw token amounts are visible in the Accounting section.",
      },
    ],
  },
  {
    title: "Schedule & Shifts",
    items: [
      {
        q: "How do I see my upcoming shifts?",
        a: "Go to Schedule to see your weekly calendar. Your shifts show the date, time, and assigned room. You'll also see a summary of upcoming shifts on your dashboard.",
      },
      {
        q: "Can I request a shift time?",
        a: "Yes. Go to Schedule → Request Shift. Pick your preferred date and time range. Your request goes to the studio admin for approval. You'll be notified when it's accepted or declined.",
      },
      {
        q: "Can other models see my schedule?",
        a: "No. Your schedule is completely private. Other users only see that a time slot is booked, not who booked it or any details.",
      },
      {
        q: "What if I can't make a scheduled shift?",
        a: "Contact your operator or admin as soon as possible. They can reschedule or mark the shift accordingly. Consistent no-shows will show up in your shift adherence stats.",
      },
    ],
  },
  {
    title: "Payouts & Earnings",
    items: [
      {
        q: "How is my payout calculated?",
        a: "Your payout = total tokens earned × token-to-USD rate × your cut percentage. For example: 2000 Chaturbate tokens × $0.05/token × 60% cut = $60. Your cut percentage is set by your studio admin.",
      },
      {
        q: "When do I get paid?",
        a: "Payout schedules are set by your studio. Check with your admin for the specific pay dates and method. You can see your pending and past payouts in the Payouts section.",
      },
      {
        q: "Where can I see a breakdown of my earnings?",
        a: "Go to Accounting to see your earnings broken down by date, platform, and show type. You can also see the token amounts before conversion and the studio/model split.",
      },
    ],
  },
  {
    title: "General",
    items: [
      {
        q: "Can I use StudioOS on my phone?",
        a: "Yes. StudioOS is fully mobile-optimized. Open it in your phone's browser and tap \"Add to Home Screen\" to use it like a native app with an icon on your home screen.",
      },
      {
        q: "How do I change my password?",
        a: "Go to Settings → Account → Change Password. If you've forgotten your password, use the \"Forgot Password\" link on the sign-in page to receive a reset email.",
      },
      {
        q: "What does the weekly goal feature do?",
        a: "If enabled by your admin, you'll see a weekly hour target on your dashboard with a progress bar. It tracks your total streaming hours for the current week against the goal. It's a motivational tool — no penalties for missing it.",
      },
    ],
  },
];

const accountantFAQ: FAQSection[] = [
  {
    title: "Financial Management",
    items: [
      {
        q: "What can I access as an Accountant?",
        a: "You have access to Accounting (earnings entries), Payouts (model payment calculations), and Data Backup (financial exports). You can view and manage all financial data for the studio but cannot access scheduling, user management, or analytics.",
      },
      {
        q: "How do I enter earnings?",
        a: "Go to Accounting → Add Entry. Select the model, date, and enter token amounts per platform. USD values are calculated automatically using the studio's configured token rates. The studio/model split is applied based on each model's cut percentage.",
      },
      {
        q: "How do token-to-USD rates work?",
        a: "Each cam platform has a different token value. The rates are configured in studio Settings. Defaults: MyFreeCams $0.05, Chaturbate $0.05, StripChat $0.05, CamSoda $0.05, BongaCams $0.02, Cam4 $0.10, Flirt4Free $0.03, LiveJasmin $1.00. Ask your admin to adjust if needed.",
      },
      {
        q: "How do I calculate payouts for a pay period?",
        a: "Go to Payouts, select the date range, and the system calculates each model's payout based on their earnings and cut percentage. You can export this as a CSV for your records or payment processing.",
      },
      {
        q: "Can I edit a past earnings entry?",
        a: "Yes, you can edit entries in the Accounting section. Changes to past entries are logged in the audit trail. If the studio requires admin approval for changes, your edit will be marked as pending.",
      },
      {
        q: "How do I export financial reports?",
        a: "Go to Data Backup → Export. Select the data type (earnings, payouts, etc.) and date range. The export generates a CSV file you can open in Excel or Google Sheets.",
      },
    ],
  },
];

export default function FAQPage() {
  const router = useRouter();
  const { account, loading: authLoading } = useAuth();
  const userRole = account?.role || "model";

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!account) {
    router.push("/sign-in");
    return null;
  }

  const roleLabel: Record<string, string> = {
    owner: "Studio Owner",
    admin: "Admin",
    operator: "Operator",
    model: "Model",
    accountant: "Accountant",
  };

  const faqMap: Record<string, FAQSection[]> = {
    owner: ownerAdminFAQ,
    admin: ownerAdminFAQ,
    operator: operatorFAQ,
    model: modelFAQ,
    accountant: accountantFAQ,
  };

  const sections = faqMap[userRole] || modelFAQ;

  return (
    <div className="max-w-2xl mx-auto py-2">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <HelpCircle className="w-5 h-5 text-[#C9A84C]" />
          <h1 className="text-lg font-semibold text-white">
            Help & FAQ
          </h1>
        </div>
        <p className="text-xs text-[#A8A49A]/40 ml-8">
          Showing answers relevant to your role: {roleLabel[userRole] || userRole}
        </p>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-[11px] font-medium text-[#A8A49A]/30 uppercase tracking-wider mb-1 ml-0.5">
              {section.title}
            </h2>
            <div className="bg-[#111111] rounded-xl border border-white/[0.04] px-5">
              {section.items.map((item, i) => (
                <Accordion key={i} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
        <p className="text-xs text-[#A8A49A]/40 text-center">
          Can&apos;t find what you need?{" "}
          <a
            href="mailto:support@getstudioos.com"
            className="text-[#C9A84C]/70 hover:text-[#C9A84C] transition-colors"
          >
            Contact support
          </a>
          {" "}or check the{" "}
          <a
            href="/help-center"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#C9A84C]/70 hover:text-[#C9A84C] transition-colors"
          >
            full Help Center
          </a>
        </p>
      </div>
    </div>
  );
}
