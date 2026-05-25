import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@digihire/shared";
import { Badge } from "@digihire/shared";
import { Button } from "@digihire/shared";
import {
  useCampaigns,
  useMyCampaignMemberships,
  useJoinCampaign,
} from "@digihire/shared";
import type { Campaign, CampaignMembership } from "@digihire/shared";
import { formatNaira } from "@digihire/shared";

function commissionLabel(c: Campaign) {
  if (c.commission_type === "percentage")
    return `${c.commission_value}% per ${c.commission_per}`;
  return `${formatNaira(c.commission_value)} per ${c.commission_per}`;
}

function getMembershipStatus(
  campaignId: string,
  memberships: Array<CampaignMembership & { campaign: Campaign }>
): "none" | "pending" | "approved" | "rejected" {
  const m = memberships.find((m) => m.campaign_id === campaignId);
  return m ? m.status : "none";
}

export default function Campaigns() {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const { data: memberships = [], isLoading: membershipsLoading } = useMyCampaignMemberships();
  const join = useJoinCampaign();
  const [joiningId, setJoiningId] = useState<string | null>(null);

  function handleJoin(campaignId: string) {
    setJoiningId(campaignId);
    join.mutate(campaignId, {
      onSuccess: () => {
        setJoiningId(null);
        toast.success("Joined! Check My Campaigns for your tracking link.");
      },
      onError: () => {
        setJoiningId(null);
        toast.error("Failed to join. Please try again.");
      },
    });
  }

  if (isLoading || membershipsLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="w-6 h-6" /> Campaigns
        </h1>
        <p className="text-muted-foreground mt-1">
          Browse brand campaigns and earn commissions.
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No active campaigns right now. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => {
            const status = getMembershipStatus(campaign.id, memberships);
            const locked =
              campaign.eligibility_type === "restricted" && status === "none";

            return (
              <Card key={campaign.id} className={locked ? "opacity-75" : ""}>
                {campaign.banner_image_url && (
                  <img
                    src={campaign.banner_image_url}
                    alt={campaign.title}
                    className="w-full h-32 object-cover rounded-t-lg"
                  />
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">
                      {campaign.title}
                    </CardTitle>
                    {locked && (
                      <Lock
                        className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5"
                        aria-label="Restricted campaign"
                      />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {campaign.brand_name}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Commission</span>
                    <span className="font-medium">
                      {commissionLabel(campaign)}
                    </span>
                  </div>
                  {campaign.end_date && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Ends</span>
                      <span>
                        {new Date(campaign.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      {status === "approved" && (
                        <Badge className="bg-green-500">Active</Badge>
                      )}
                      {status === "pending" && (
                        <Badge variant="outline">Pending Approval</Badge>
                      )}
                      {status === "rejected" && (
                        <Badge variant="destructive">Rejected</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/talent/voltsquad/campaigns/${campaign.id}`}>
                          View
                        </Link>
                      </Button>
                      {status === "none" && !locked && (
                        <Button
                          size="sm"
                          onClick={() => handleJoin(campaign.id)}
                          disabled={joiningId === campaign.id}
                        >
                          Join
                        </Button>
                      )}
                      {locked && (
                        <Button size="sm" disabled>
                          <Lock className="w-3 h-3 mr-1" /> Locked
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
