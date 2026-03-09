"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  PartyPopper,
  Building2,
  UserPlus,
  Globe,
  Calendar,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

export default function OnboardingWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [rooms, setRooms] = useState([
    { name: "Room A", isActive: true },
    { name: "Room B", isActive: true },
    { name: "Room C", isActive: true },
  ]);

  const [model, setModel] = useState({
    fullName: "",
    studioPercentage: 30,
    weeklyGoalHours: 20,
    status: "active",
  });

  const [camAccounts, setCamAccounts] = useState<Record<string, string>>({
    stripchat: "",
    myfreecams: "",
    chaturbate: "",
    bongacams: "",
    livejasmin: "",
    cam4: "",
    camsoda: "",
  });

  const totalSteps = 6;

  // Get studio_id from user metadata or account
  const studioId = (user as unknown as Record<string, unknown>)?.studio_id as
    | string
    | undefined;

  const handleSkip = async () => {
    try {
      if (studioId) {
        await supabase
          .from("studios")
          .update({ onboarding_completed: true })
          .eq("id", studioId);
      }
      router.push("/dashboard");
    } catch (error) {
      console.error("Skip onboarding error:", error);
      toast.error("Failed to skip onboarding");
    }
  };

  const handleNext = async () => {
    setLoading(true);
    try {
      if (step === 2 && studioId) {
        // Create rooms
        for (const room of rooms) {
          await supabase.from("rooms").insert({
            name: room.name,
            is_active: room.isActive,
            studio_id: studioId,
          });
        }
        toast.success("Rooms created");
      }

      if (step === 3) {
        if (!model.fullName) {
          toast.error("Please enter model name");
          setLoading(false);
          return;
        }
      }

      if (step === 4 && studioId) {
        // Create model account
        const { data: createdModel } = await supabase
          .from("accounts")
          .insert({
            full_name: model.fullName,
            email: `${model.fullName.toLowerCase().replace(/\s/g, "")}@temp.local`,
            role: "model",
            cut_percentage: 100 - model.studioPercentage,
            studio_id: studioId,
            is_active: true,
          })
          .select()
          .single();

        if (createdModel) {
          // Create cam accounts
          const accountsToCreate = Object.entries(camAccounts)
            .filter(([, username]) => username.trim() !== "")
            .map(([platform, username]) => ({
              model_id: createdModel.id,
              studio_id: studioId,
              platform: platform as import("@/lib/supabase/types").CamPlatform,
              username: username.trim(),
              is_active: true,
            }));

          if (accountsToCreate.length > 0) {
            await Promise.all(
              accountsToCreate.map((account) =>
                supabase.from("cam_accounts").insert(account)
              )
            );
          }
        }

        toast.success("Model and accounts created");
      }

      if (step === 6 && studioId) {
        await supabase
          .from("studios")
          .update({ onboarding_completed: true })
          .eq("id", studioId);
        router.push("/dashboard");
        return;
      }

      setStep(step + 1);
    } catch (error) {
      console.error("Onboarding step error:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Welcome to StudioOS!
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Let&apos;s get your studio set up. This will take about 5
              minutes.
            </p>
            <div className="bg-white/[0.03] rounded-lg p-6 max-w-md mx-auto text-left border border-white/[0.06]">
              <p className="text-white font-semibold mb-3">
                We&apos;ll help you:
              </p>
              <div className="space-y-2">
                {[
                  "Create your first room",
                  "Add your first model",
                  "Set up cam site tracking",
                  "Book your first shift",
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-[#A8A49A]"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-semibold text-sm">
                      {i + 1}
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Building2 className="w-12 h-12 text-[#C9A84C] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Set Up Your Rooms
              </h2>
              <p className="text-gray-400">
                Every studio starts with 3 rooms. You can add more later.
              </p>
            </div>
            <div className="space-y-4 max-w-md mx-auto">
              {rooms.map((room, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Label className="text-white w-20">
                    Room {index + 1}:
                  </Label>
                  <Input
                    value={room.name}
                    onChange={(e) => {
                      const newRooms = [...rooms];
                      newRooms[index].name = e.target.value;
                      setRooms(newRooms);
                    }}
                    className="bg-white/[0.04] border-white/[0.06] text-white"
                  />
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <UserPlus className="w-12 h-12 text-[#C9A84C] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Add Your First Model
              </h2>
            </div>
            <div className="space-y-4 max-w-md mx-auto">
              <div>
                <Label htmlFor="fullName" className="text-white">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  value={model.fullName}
                  onChange={(e) =>
                    setModel({ ...model, fullName: e.target.value })
                  }
                  placeholder="Anastasia"
                  className="bg-white/[0.04] border-white/[0.06] text-white mt-1"
                />
              </div>
              <div>
                <Label
                  htmlFor="studioPercentage"
                  className="text-white"
                >
                  Studio Percentage
                </Label>
                <div className="flex items-center gap-3 mt-1">
                  <Input
                    id="studioPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={model.studioPercentage}
                    onChange={(e) =>
                      setModel({
                        ...model,
                        studioPercentage: Number(e.target.value),
                      })
                    }
                    className="bg-white/[0.04] border-white/[0.06] text-white"
                  />
                  <span className="text-[#A8A49A]/60">
                    % (you keep {model.studioPercentage}%)
                  </span>
                </div>
              </div>
              <div>
                <Label htmlFor="weeklyGoal" className="text-white">
                  Weekly Goal
                </Label>
                <div className="flex items-center gap-3 mt-1">
                  <Input
                    id="weeklyGoal"
                    type="number"
                    min="1"
                    max="168"
                    value={model.weeklyGoalHours}
                    onChange={(e) =>
                      setModel({
                        ...model,
                        weeklyGoalHours: Number(e.target.value),
                      })
                    }
                    className="bg-white/[0.04] border-white/[0.06] text-white"
                  />
                  <span className="text-[#A8A49A]/60">
                    hours per week
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Globe className="w-12 h-12 text-[#C9A84C] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Add Cam Site Accounts
              </h2>
              <p className="text-gray-400">
                For model:{" "}
                <span className="text-[#C9A84C] font-semibold">
                  {model.fullName}
                </span>
              </p>
            </div>
            <div className="space-y-3 max-w-md mx-auto">
              {Object.keys(camAccounts).map((platform) => (
                <div key={platform}>
                  <Label
                    htmlFor={platform}
                    className="text-white capitalize"
                  >
                    {platform === "myfreecams"
                      ? "MyFreeCams"
                      : platform}
                    :
                  </Label>
                  <Input
                    id={platform}
                    value={camAccounts[platform]}
                    onChange={(e) =>
                      setCamAccounts({
                        ...camAccounts,
                        [platform]: e.target.value,
                      })
                    }
                    placeholder={`Username on ${platform}`}
                    className="bg-white/[0.04] border-white/[0.06] text-white mt-1"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Calendar className="w-12 h-12 text-[#C9A84C] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Book First Shift (Optional)
              </h2>
              <p className="text-gray-400">
                You can skip this and schedule shifts later
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 mb-4">
                Shift scheduling will be available in your dashboard
              </p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="text-center space-y-6">
            <PartyPopper className="w-16 h-16 text-[#C9A84C] mx-auto" />
            <h2 className="text-3xl font-bold text-white mb-4">
              You&apos;re All Set! 🎊
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Your studio is ready to go.
            </p>
            <div className="bg-white/[0.03] rounded-lg p-6 max-w-md mx-auto text-left border border-white/[0.06]">
              <p className="text-white font-semibold mb-3">
                Next steps:
              </p>
              <ul className="space-y-2 text-[#A8A49A]">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Stream tracking starts in 15 minutes
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Invite your team members
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Explore the dashboard
                </li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-[#A8A49A]/60">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm text-[#A8A49A]/60">
              {Math.round((step / totalSteps) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-[#111111]/80 rounded-xl p-8 border border-white/[0.06] mb-6">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-[#A8A49A]/60 hover:text-white"
          >
            Skip for now
          </Button>
          <div className="flex gap-3">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="border-white/[0.06] text-white"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={loading}
              className="bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] hover:from-[#B8973B] hover:to-[#D4C07A] text-black font-semibold"
            >
              {loading
                ? "Loading..."
                : step === totalSteps
                  ? "Go to Dashboard"
                  : step === 1
                    ? "Let's Go!"
                    : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
