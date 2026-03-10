"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Video, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/client";

const PLATFORMS = [
  { value: "MyFreeCams", label: "MyFreeCams" },
  { value: "Chaturbate", label: "Chaturbate" },
  { value: "StripChat", label: "StripChat" },
  { value: "BongaCams", label: "BongaCams" },
  { value: "Cam4", label: "Cam4" },
  { value: "CamSoda", label: "CamSoda" },
  { value: "Flirt4Free", label: "Flirt4Free" },
  { value: "LiveJasmin", label: "LiveJasmin" },
];

interface CamAccountsTabProps {
  user: {
    id: string;
    first_name: string;
    [key: string]: unknown;
  };
  studioId: string;
}

export default function CamAccountsTab({ user, studioId }: CamAccountsTabProps) {
  const queryClient = useQueryClient();
  const { studio } = useAuth();
  const supabase = createClient();
  const [newPlatform, setNewPlatform] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState("");

  const { data: camAccounts = [], isLoading } = useQuery({
    queryKey: ["camAccounts", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("cam_accounts")
        .select("*")
        .eq("model_id", user.id);
      return data || [];
    },
  });

  const [addingInProgress, setAddingInProgress] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const { data: created, error } = await supabase
        .from("cam_accounts")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return created;
    },
    onSuccess: async (created) => {
      queryClient.invalidateQueries({ queryKey: ["camAccounts", user.id] });
      setNewPlatform("");
      setNewUsername("");
      setAddingInProgress(false);
      toast.success("Cam account added — fetching 30 days of historical data...");

      // Create a DataFetchJob and trigger historical data fetch
      try {
        const { data: job, error: jobError } = await supabase
          .from("data_fetch_jobs")
          .insert({
            studio_id: studioId,
            cam_account_id: created.id,
            model_id: user.id,
            model_name: user.first_name,
            platform: created.platform,
            username: created.username,
            status: "pending",
            target_days: 30,
            pages_fetched: 0,
          })
          .select()
          .single();

        if (jobError) {
          console.error("Failed to create data fetch job:", jobError);
          return;
        }

        queryClient.invalidateQueries({ queryKey: ["dataFetchJobs"] });

        // Fire-and-forget: trigger the historical data fetch
        fetch("/api/data-fetch/historical", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cam_account_id: created.id,
            job_id: job.id,
          }),
        }).catch((err) => console.error("Historical fetch trigger failed:", err));
      } catch (err) {
        console.error("Failed to trigger historical fetch:", err);
      }
    },
    onError: () => {
      setAddingInProgress(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("cam_accounts")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["camAccounts", user.id] });
      setEditingId(null);
      setEditUsername("");
      toast.success("Cam account updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cam_accounts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["camAccounts", user.id] });
      toast.success("Cam account removed");
    },
  });

  // Elite trial restriction: only 1 cam account per model
  const isEliteTrial = studio?.subscription_tier === "elite" && studio?.subscription_status === "trialing";
  const trialCamLimit = isEliteTrial ? 1 : Infinity;

  const handleAdd = () => {
    if (addingInProgress || createMutation.isPending) return;
    if (!newPlatform || !newUsername.trim()) {
      toast.error("Please select a platform and enter a username");
      return;
    }
    if (activeAccounts.length >= trialCamLimit) {
      toast.error("Elite trial is limited to 1 cam account per model. Subscribe to add more.");
      return;
    }
    // Case-insensitive duplicate check: same platform + same username
    const existsPlatform = camAccounts.find(
      (ca) => ca.platform === newPlatform && ca.is_active !== false
    );
    if (existsPlatform) {
      toast.error(`A ${newPlatform} account already exists for this model`);
      return;
    }
    setAddingInProgress(true);
    createMutation.mutate({
      model_id: user.id,
      studio_id: studioId,
      platform: newPlatform,
      username: newUsername.trim(),
      is_active: true,
    });
  };

  const handleUpdate = (id: string) => {
    if (!editUsername.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    updateMutation.mutate({ id, data: { username: editUsername.trim() } });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Remove this cam account?")) {
      deleteMutation.mutate(id);
    }
  };

  const activeAccounts = camAccounts.filter((ca) => ca.is_active !== false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      {isEliteTrial && (
        <div className="p-3 bg-amber-500/[0.06] border border-amber-500/15 rounded-lg">
          <p className="text-xs text-amber-400/80">
            <strong className="text-amber-400">Trial Mode:</strong> Limited to 1 model with 1 cam account on 1 platform. Subscribe to unlock full access.
          </p>
        </div>
      )}
      {activeAccounts.length === 0 && (
        <p className="text-sm text-[#A8A49A]/40 text-center py-4">
          No cam accounts linked yet. Add one below.
        </p>
      )}

      {activeAccounts.map((ca) => (
        <div
          key={ca.id}
          className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/[0.04]"
        >
          <Video className="w-4 h-4 text-[#C9A84C] shrink-0" />
          <div className="flex-1 min-w-0">
            <Badge variant="outline" className="text-gray-100 mb-1 px-2.5 py-0.5 text-xs font-semibold rounded-md inline-flex items-center border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              {ca.platform}
            </Badge>
            {editingId === ca.id ? (
              <div className="flex gap-2 mt-1">
                <Input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="bg-white/[0.04] border-white/[0.06] text-white h-8 text-sm"
                  placeholder="Username"
                />
                <Button
                  size="sm"
                  onClick={() => handleUpdate(ca.id)}
                  className="bg-[#C9A84C] hover:bg-[#B8973B] text-black h-8"
                  disabled={updateMutation.isPending}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingId(null)}
                  className="h-8"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <p
                className="text-sm font-medium text-white cursor-pointer hover:underline"
                onClick={() => {
                  setEditingId(ca.id);
                  setEditUsername(ca.username);
                }}
                title="Click to edit username"
              >
                {ca.username}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(ca.id)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0 h-8 w-8"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}

      <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.04] space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white">Add Cam Account</p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-[#A8A49A]/40 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[240px] bg-[#1A1A1A] border-white/10 text-xs">
                <p>When you add a new cam account, the system automatically fetches 30 days of historical streaming data. This process takes approximately 20-30 minutes per account.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-100 text-xs font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Platform</Label>
          <Select value={newPlatform} onValueChange={(v) => v !== null && setNewPlatform(v)}>
            <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-100 text-xs font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Username</Label>
          <Input
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="e.g. ModelName123"
            className="bg-white/[0.04] border-white/[0.06] text-white"
          />
        </div>
        <Button
          onClick={handleAdd}
          className="w-full bg-[#C9A84C] hover:bg-[#B8973B] text-black"
          disabled={addingInProgress || createMutation.isPending}
        >
          {(addingInProgress || createMutation.isPending) ? (
            <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Adding...</>
          ) : (
            <><Plus className="w-4 h-4 mr-1" /> Add Cam Account</>
          )}
        </Button>
      </div>
    </div>
  );
}
