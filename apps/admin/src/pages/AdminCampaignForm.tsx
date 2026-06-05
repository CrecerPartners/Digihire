import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { Label } from "@digihire/shared";
import { Textarea, RichTextEditor } from "@digihire/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@digihire/shared";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@digihire/shared";
import {
  useCreateCampaign,
  useUpdateCampaign,
  type CampaignFormInput,
  type Campaign,
} from "@/hooks/useAdminCampaigns";

interface AdminCampaignFormProps {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  campaign?: Campaign;
}

const EMPTY: CampaignFormInput = {
  title: "",
  description: "",
  brand_name: "",
  banner_image_url: "",
  join_type: "instant",
  eligibility_type: "open",
  eligibility_criteria: null,
  commission_type: "flat",
  commission_value: 0,
  commission_per: "sale",
  start_date: null,
  end_date: null,
  assets: [],
  tracking_link_base: "",
};

export default function AdminCampaignForm({
  open,
  onOpenChange,
  campaign,
}: AdminCampaignFormProps) {
  const create = useCreateCampaign();
  const update = useUpdateCampaign();
  const [form, setForm] = useState<CampaignFormInput>(
    campaign
      ? {
          title: campaign.title,
          description: campaign.description ?? "",
          brand_name: campaign.brand_name,
          banner_image_url: campaign.banner_image_url ?? "",
          join_type: campaign.join_type,
          eligibility_type: campaign.eligibility_type,
          eligibility_criteria: campaign.eligibility_criteria,
          commission_type: campaign.commission_type,
          commission_value: campaign.commission_value,
          commission_per: campaign.commission_per,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          assets: campaign.assets,
          tracking_link_base: campaign.tracking_link_base ?? "",
        }
      : EMPTY
  );

  function set<K extends keyof CampaignFormInput>(
    key: K,
    value: CampaignFormInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (campaign) {
      update.mutate(
        { id: campaign.id, ...form },
        {
          onSuccess: () => {
            toast.success("Campaign updated.");
            onOpenChange?.(false);
          },
          onError: () => toast.error("Update failed."),
        }
      );
    } else {
      create.mutate(form, {
        onSuccess: () => {
          toast.success("Campaign created as draft.");
          onOpenChange?.(false);
        },
        onError: () => toast.error("Create failed."),
      });
    }
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {campaign ? "Edit Campaign" : "New Campaign"}
          </SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Brand Name</Label>
            <Input
              required
              value={form.brand_name}
              onChange={(e) => set("brand_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <RichTextEditor
              value={form.description || ''}
              onChange={html => set("description", html)}
              placeholder="Describe this campaign..."
              minHeight="110px"
            />
          </div>
          <div className="space-y-2">
            <Label>Banner Image URL</Label>
            <Input
              value={form.banner_image_url}
              onChange={(e) => set("banner_image_url", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Join Type</Label>
              <Select
                value={form.join_type}
                onValueChange={(v) =>
                  set("join_type", v as "instant" | "approval")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Instant</SelectItem>
                  <SelectItem value="approval">Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Eligibility</Label>
              <Select
                value={form.eligibility_type}
                onValueChange={(v) =>
                  set("eligibility_type", v as "open" | "restricted")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Commission Type</Label>
              <Select
                value={form.commission_type}
                onValueChange={(v) =>
                  set("commission_type", v as "percentage" | "flat")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat (₦)</SelectItem>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Per</Label>
              <Select
                value={form.commission_per}
                onValueChange={(v) =>
                  set("commission_per", v as "sale" | "lead" | "activation")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="activation">Activation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Commission Value</Label>
            <Input
              type="number"
              min="0"
              required
              value={form.commission_value}
              onChange={(e) =>
                set("commission_value", Number(e.target.value))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.start_date?.split("T")[0] ?? ""}
                onChange={(e) => set("start_date", e.target.value || null)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={form.end_date?.split("T")[0] ?? ""}
                onChange={(e) => set("end_date", e.target.value || null)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tracking Link Base URL</Label>
            <Input
              value={form.tracking_link_base}
              onChange={(e) => set("tracking_link_base", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending
              ? "Saving..."
              : campaign
              ? "Update Campaign"
              : "Create Campaign"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}


