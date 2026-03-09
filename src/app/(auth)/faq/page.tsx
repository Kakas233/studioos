"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HelpCircle,
  Book,
  Calendar,
  DollarSign,
  Settings,
  Users,
  FileText,
  type LucideIcon,
} from "lucide-react";

interface FAQItem {
  icon: LucideIcon;
  question: string;
  answer: string;
}

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

  const isAdmin = userRole === "owner" || userRole === "admin";
  const effectiveRole = isAdmin ? "admin" : userRole;

  const adminFAQ: FAQItem[] = [
    {
      icon: Users,
      question: "How do I manage user permissions?",
      answer:
        "Go to the 'Users' tab. You can create new accounts, delete access, or reset passwords. Note that 'Cut %' and 'Payout Method' affect the financial calculations immediately.",
    },
    {
      icon: FileText,
      question: "How does the Data Backup work?",
      answer:
        "The 'Export Database' button generates a CSV file of all current local data. We recommend doing this weekly.",
    },
    {
      icon: DollarSign,
      question: "How do I approve financial edits?",
      answer:
        "If an Operator edits a past shift, it appears in the 'Pending Requests' notification area. You must Approve or Reject the change to update the official ledger.",
    },
    {
      icon: Settings,
      question: "Can I change a user's role after creating them?",
      answer:
        "Yes, go to Users tab, click Edit, and change the role dropdown.",
    },
    {
      icon: Settings,
      question: "What happens if I change the Token Value?",
      answer:
        "Changing the global Token Value only affects *future* accounting entries. Past shifts that are already 'Completed' will retain their original calculated value.",
    },
    {
      icon: Users,
      question: "How do I reset a forgotten password?",
      answer:
        "Go to the Users tab, click the 'Edit' (Pencil) icon for that user, and type a new password in the 'New Password' field. Save to update immediately.",
    },
  ];

  const operatorFAQ: FAQItem[] = [
    {
      icon: Settings,
      question: "Why is the 'Room' field locked?",
      answer:
        "The system automatically selects the Room based on the Model you choose. This prevents scheduling conflicts.",
    },
    {
      icon: FileText,
      question: "How do I edit a completed shift?",
      answer:
        "Navigate to Accounting, open the shift, and modify the values. Note: Editing a past shift triggers an Admin Approval request.",
    },
    {
      icon: HelpCircle,
      question: "Can I see other operators' shifts?",
      answer:
        "For privacy, you can only see full details for your assigned models. Shifts booked by others appear as gray 'Booked' blocks.",
    },
    {
      icon: Calendar,
      question: "Why can't I cancel a shift?",
      answer:
        "Only Admins can set a shift to 'Cancelled' status. If a model cannot make it, edit the shift status to 'No Show' or contact an Admin.",
    },
    {
      icon: Settings,
      question: "How do I know which Room to choose?",
      answer:
        "When you select a Model in the booking form, the system automatically locks in their assigned Room.",
    },
    {
      icon: DollarSign,
      question: "My 'Total Revenue' seems low. Why?",
      answer:
        "The Accounting tab shows *your* generated revenue share, not the total studio gross.",
    },
  ];

  const modelFAQ: FAQItem[] = [
    {
      icon: DollarSign,
      question: "When are payouts calculated?",
      answer:
        "Pay periods are the 1st-15th (paid on the 17th) and 16th-End (paid on the 2nd).",
    },
    {
      icon: FileText,
      question: "Why is my revenue different from the tokens I see?",
      answer:
        "Your dashboard shows your Net Payout (your cut %), not the total revenue generated.",
    },
    {
      icon: HelpCircle,
      question: "How do I report my earnings?",
      answer:
        "Send your token counts to your assigned Operator at the end of every shift. They handle the official accounting entry.",
    },
    {
      icon: Calendar,
      question: "Can other models see my schedule?",
      answer:
        "No. Your calendar is private. Other users only see a gray 'Booked' block.",
    },
    {
      icon: Settings,
      question: "Can I change my assigned Room?",
      answer:
        "Room assignments are fixed by the Admin. Contact the Studio Manager if you need a switch.",
    },
    {
      icon: HelpCircle,
      question: "Is there a mobile app?",
      answer:
        "This web app is optimized for mobile. You can 'Add to Home Screen' on your phone to use it like a native app.",
    },
  ];

  const faqContent: Record<string, FAQItem[]> = {
    admin: adminFAQ,
    operator: operatorFAQ,
    model: modelFAQ,
  };
  const currentFAQ = faqContent[effectiveRole] || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="bg-[#111111]/80 border-white/[0.04]">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Book className="w-6 h-6 text-[#C9A84C]" />
            Frequently Asked Questions
            <span className="text-sm font-normal text-white/50 ml-2">
              ({effectiveRole} view)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentFAQ.map((item, index) => (
            <Card
              key={index}
              className="bg-white/[0.03] border-white/[0.06]"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/[0.05] rounded-lg">
                    <item.icon className="w-5 h-5 text-[#C9A84C]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-2">
                      {item.question}
                    </h3>
                    <p className="text-sm text-[#A8A49A]/70 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-blue-500/[0.06] border-blue-500/10">
        <CardContent className="p-4">
          <p className="text-sm text-blue-300">
            <strong>Need more help?</strong> Contact your admin or check the
            documentation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
