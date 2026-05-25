import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@digihire/shared";
import { Badge } from "@digihire/shared";
import { Button } from "@digihire/shared";
import {
  useMyCampaignMemberships,
  useMyCampaignEarnings,
} from "@digihire/shared";
import { formatNaira } from "@digihire/shared";

export default function MyCampaigns() {
  const { data: memberships = [], isLoading } = useMyCampaignMemberships();
  const { data: allEarnings = [] } = useMyCampaignEarnings();

  if (isLoading) {
    return <div className="p-6 h-64 bg-muted rounded-lg animate-pulse" />;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Campaigns</h1>
        <p className="text-muted-foreground mt-1">Campaigns you have joined.</p>
      </div>

      {memberships.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground">You haven't joined any campaigns yet.</p>
          <Button asChild>
            <Link to="/talent/voltsquad/campaigns">Browse Campaigns</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {memberships.map((m) => {
            const campaignEarnings = allEarnings.filter((e) => e.campaign_id === m.campaign_id);
            const totalPending = campaignEarnings.filter((e) => e.status === "pending").reduce((s, e) => s + e.amount, 0);
            const totalPaid = campaignEarnings.filter((e) => e.status === "paid").reduce((s, e) => s + e.amount, 0);
            const totalAll = campaignEarnings.reduce((s, e) => s + e.amount, 0);

            return (
              <Card key={m.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{m.campaign.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{m.campaign.brand_name}</p>
                    </div>
                    {m.status === "approved" && <Badge className="bg-green-500">Active</Badge>}
                    {m.status === "pending" && <Badge variant="outline">Pending</Badge>}
                    {m.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div>
                      <p className="font-semibold">{formatNaira(totalAll)}</p>
                      <p className="text-muted-foreground text-xs">Submitted</p>
                    </div>
                    <div>
                      <p className="font-semibold">{formatNaira(totalPending)}</p>
                      <p className="text-muted-foreground text-xs">Pending</p>
                    </div>
                    <div>
                      <p className="font-semibold">{formatNaira(totalPaid)}</p>
                      <p className="text-muted-foreground text-xs">Paid Out</p>
                    </div>
                  </div>
                  {m.tracking_link && (
                    <div className="p-2 bg-muted rounded text-xs font-mono break-all">{m.tracking_link}</div>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/talent/voltsquad/campaigns/${m.campaign_id}`}>View Campaign</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
