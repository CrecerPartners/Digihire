import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Lock, Download, Calculator } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@digihire/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@digihire/shared";
import { Badge } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { Label } from "@digihire/shared";
import { Textarea } from "@digihire/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@digihire/shared";
import {
  useCampaign,
  useCampaignMembership,
  useJoinCampaign,
  useCampaignSubmissions,
  useSubmitEntry,
  useMyCampaignEarnings,
} from "@digihire/shared";
import { formatNaira } from "@digihire/shared";

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: campaign, isLoading } = useCampaign(id!);
  const { data: membership } = useCampaignMembership(id!);
  const { data: submissions = [] } = useCampaignSubmissions(id!);
  const { data: earnings = [] } = useMyCampaignEarnings(id);
  const join = useJoinCampaign();
  const submit = useSubmitEntry();

  const [calcVolume, setCalcVolume] = useState("");
  const [submitAmount, setSubmitAmount] = useState("");
  const [submitNotes, setSubmitNotes] = useState("");
  const [submitType, setSubmitType] = useState<"manual" | "tracked">("manual");

  if (isLoading || !campaign) {
    return <div className="p-6 h-64 bg-muted rounded-lg animate-pulse" />;
  }

  const isApprovedMember = membership?.status === "approved";

  const calcProjected =
    calcVolume && !isNaN(Number(calcVolume)) && Number(calcVolume) > 0
      ? campaign.commission_type === "percentage"
        ? (Number(calcVolume) * campaign.commission_value) / 100
        : Number(calcVolume) * campaign.commission_value
      : null;

  function handleJoin() {
    join.mutate(campaign!.id, {
      onSuccess: () =>
        toast.success(
          campaign!.join_type === "instant"
            ? "Joined! Your tracking link is ready."
            : "Request submitted. Waiting for admin approval."
        ),
      onError: () => toast.error("Failed to join."),
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!membership) return;
    submit.mutate(
      {
        campaignId: campaign!.id,
        membershipId: membership.id,
        submissionType: submitType,
        amount: Number(submitAmount),
        notes: submitNotes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Submission received. Pending review.");
          setSubmitAmount("");
          setSubmitNotes("");
        },
        onError: () => toast.error("Submission failed."),
      }
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <Link
        to="/talent/voltsquad/campaigns"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> All Campaigns
      </Link>

      {campaign.banner_image_url && (
        <img
          src={campaign.banner_image_url}
          alt={campaign.title}
          className="w-full h-48 object-cover rounded-lg"
        />
      )}

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{campaign.title}</h1>
          <p className="text-muted-foreground">{campaign.brand_name}</p>
        </div>
        {!membership && (
          <Button onClick={handleJoin} disabled={join.isPending}>
            {join.isPending ? "Joining..." : "Join Campaign"}
          </Button>
        )}
        {membership?.status === "pending" && (
          <Badge variant="outline">Pending Approval</Badge>
        )}
        {membership?.status === "approved" && (
          <Badge className="bg-green-500">Active Member</Badge>
        )}
        {membership?.status === "rejected" && (
          <Badge variant="destructive">Rejected</Badge>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          {isApprovedMember && (
            <TabsTrigger value="submit">Submit Entry</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {campaign.description && <p>{campaign.description}</p>}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Commission</span>
                  <p className="font-medium">
                    {campaign.commission_type === "percentage"
                      ? `${campaign.commission_value}%`
                      : formatNaira(campaign.commission_value)}{" "}
                    per {campaign.commission_per}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Join Type</span>
                  <p className="font-medium capitalize">{campaign.join_type}</p>
                </div>
                {campaign.start_date && (
                  <div>
                    <span className="text-muted-foreground">Start Date</span>
                    <p className="font-medium">
                      {new Date(campaign.start_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {campaign.end_date && (
                  <div>
                    <span className="text-muted-foreground">End Date</span>
                    <p className="font-medium">
                      {new Date(campaign.end_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              {isApprovedMember && membership?.tracking_link && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Your tracking link</p>
                  <p className="text-sm font-mono break-all">{membership.tracking_link}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {earnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold">
                      {formatNaira(earnings.reduce((s, e) => s + e.amount, 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">
                      {formatNaira(earnings.filter((e) => e.status === "pending").reduce((s, e) => s + e.amount, 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">
                      {formatNaira(earnings.filter((e) => e.status === "paid").reduce((s, e) => s + e.amount, 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">Paid Out</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calculator" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="w-4 h-4" /> Earnings Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  {campaign.commission_per === "sale"
                    ? "Number of Sales"
                    : `Number of ${campaign.commission_per}s`}
                </Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Enter volume"
                  value={calcVolume}
                  onChange={(e) => setCalcVolume(e.target.value)}
                />
              </div>
              {calcProjected !== null && (
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Projected Earnings</p>
                  <p className="text-3xl font-bold mt-1">{formatNaira(calcProjected)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="pt-4">
          {!isApprovedMember ? (
            <div className="text-center py-16 space-y-3">
              <Lock className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Join this campaign to access brand assets.</p>
            </div>
          ) : campaign.assets.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No assets uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {campaign.assets.map((asset, i) => (
                <Card key={i}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{asset.label}</p>
                      <p className="text-xs text-muted-foreground capitalize">{asset.type}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={asset.url} download target="_blank" rel="noreferrer">
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {isApprovedMember && (
          <TabsContent value="submit" className="pt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Submit a Sale</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex gap-3">
                    <Button type="button" variant={submitType === "manual" ? "default" : "outline"} size="sm" onClick={() => setSubmitType("manual")}>
                      Manual Entry
                    </Button>
                    <Button type="button" variant={submitType === "tracked" ? "default" : "outline"} size="sm" onClick={() => setSubmitType("tracked")}>
                      Tracked Link
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Sale Amount (₦)</Label>
                    <Input type="number" min="0" required value={submitAmount} onChange={(e) => setSubmitAmount(e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea value={submitNotes} onChange={(e) => setSubmitNotes(e.target.value)} placeholder="Any additional context..." rows={3} />
                  </div>
                  <Button type="submit" disabled={submit.isPending}>
                    {submit.isPending ? "Submitting..." : "Submit Entry"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {submissions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Submission History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{new Date(s.submitted_at).toLocaleDateString()}</TableCell>
                          <TableCell className="capitalize">{s.submission_type}</TableCell>
                          <TableCell>{formatNaira(s.amount)}</TableCell>
                          <TableCell>
                            {s.status === "approved" && <Badge className="bg-green-500">Approved</Badge>}
                            {s.status === "pending_review" && <Badge variant="outline">Pending</Badge>}
                            {s.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
