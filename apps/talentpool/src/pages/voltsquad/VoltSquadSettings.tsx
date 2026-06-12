import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { Textarea } from "@digihire/shared";
import { Avatar, AvatarImage, AvatarFallback } from "@digihire/shared";
import { Badge } from "@digihire/shared";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@digihire/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@digihire/shared";
import { useProfile, useUpdateProfile, useUploadAvatar } from "@digihire/shared";
import { useMyShopItems, useRemoveFromShop } from "@/hooks/useSellerShop";
import { useProducts } from "@digihire/shared";
import { useAuth } from "@digihire/shared";
import { supabase, uploadFileToR2 } from "@digihire/shared";
import { formatNaira } from "@digihire/shared";
import {
  User, Building2, Phone, CreditCard, Save, Loader2, Camera,
  Store, Link2, Trash2, ExternalLink, ShoppingBag, Copy,
  CircleCheck, CircleAlert, Settings, Upload, ShieldCheck,
  Instagram, AtSign, Globe, QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@digihire/shared";
import { useQueryClient } from "@tanstack/react-query";
import { KYCModal } from "@/components/voltsquad/KYCModal";
import { MfaSetup } from "@/components/voltsquad/MfaSetup";
import { Lock } from "lucide-react";
import { getFriendlyError } from '@digihire/shared';

const toSlug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

const BANK_NAMES: Record<string, string> = {
  "044": "Access Bank",
  "063": "Access Bank (Diamond)",
  "035A": "ALAT by Wema",
  "023": "Citibank",
  "050": "EcoBank",
  "011": "First Bank",
  "214": "First City Monument Bank",
  "058": "Guaranty Trust Bank",
  "030": "Heritage Bank",
  "301": "Jaiz Bank",
  "082": "Keystone Bank",
  "526": "Moniepoint",
  "076": "Polaris Bank",
  "101": "Providus Bank",
  "221": "Stanbic IBTC",
  "068": "Standard Chartered",
  "232": "Sterling Bank",
  "100": "Suntrust Bank",
  "032": "Union Bank",
  "033": "United Bank for Africa",
  "215": "Unity Bank",
  "035": "Wema Bank",
  "057": "Zenith Bank",
  "000014": "OPay",
  "000013": "GTBank (737)",
  "000016": "Kuda",
  "000024": "PalmPay",
  "100004": "Opay",
  "090267": "Kuda Bank",
  "100033": "Palmpay",
  "090328": "Moniepoint",
  "070": "Fidelity Bank",
};

const VoltSquadSettings = () => {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const queryClient = useQueryClient();
  const { data: shopItemIds = [] } = useMyShopItems();
  const { data: allProducts = [] } = useProducts();
  const removeFromShop = useRemoveFromShop();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const idDocInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState({
    name: "", email: "", whatsapp: "",
    bank_name: "", account_number: "", bank_code: "",
    account_type: "", social_links: { tiktok: "", snapchat: "", instagram: "", twitter: "" },
    bank_account_verified: false,
  });

  const [securityForm, setSecurityForm] = useState({
    transaction_pin: "",
  });

  const [shopForm, setShopForm] = useState({ shop_name: "", shop_slug: "", bio: "" });
  const [initialized, setInitialized] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [kycOpen, setKycOpen] = useState(false);

  useEffect(() => {
    const checkMfa = async () => {
      await supabase.auth.mfa.listFactors();
    };
    checkMfa();
  }, []);

  const deriveAccountType = (university: string): string => {
    const raw = university?.split(" — ")[0]?.trim() || "";
    const map: Record<string, string> = {
      "Student": "student", "NYSC member": "nysc", "Fresh grad": "graduate",
      "Corporate": "corporate", "Micro-influencer": "creator",
      "Content creator": "creator", "Young urban youth seller": "creator",
    };
    return map[raw] || "";
  };

  if (profile && !initialized) {
    const sl = profile.social_links || {};
    const accountType = profile.account_type || deriveAccountType(profile.university);
    setProfileForm({
      name: profile.name || "", email: profile.email || "",
      whatsapp: profile.whatsapp || "",
      bank_name: profile.bank_name || "", account_number: profile.account_number || "", bank_code: profile.bank_code || "",
      account_type: accountType,
      social_links: { tiktok: sl.tiktok || "", snapchat: sl.snapchat || "", instagram: sl.instagram || "", twitter: sl.twitter || "" },
      bank_account_verified: profile.bank_account_verified || false,
    });
    setSecurityForm({ transaction_pin: "" });
    setShopForm({
      shop_name: profile.shop_name || "",
      shop_slug: profile.shop_slug || toSlug(profile.shop_name || profile.name || ""),
      bio: profile.bio || "",
    });
    setInitialized(true);
  }

  const [slugTouched, setSlugTouched] = useState(false);
  useEffect(() => {
    if (!slugTouched && shopForm.shop_name) {
      setShopForm(f => ({ ...f, shop_slug: toSlug(f.shop_name) }));
    }
  }, [shopForm.shop_name, slugTouched]);

  const shopSlug = shopForm.shop_slug;
  const shopLink = shopSlug ? `${window.location.origin}/s/${shopSlug}` : "";
  const shopProducts = allProducts.filter(p => shopItemIds.includes(p.id));
  const referralCode = profile?.referral_code || "VOLT";
  const isShopLive = !!profile?.shop_slug && shopProducts.length > 0;

  const [verifyingBank, setVerifyingBank] = useState(false);

  const handleSaveProfile = async () => {
    try {
      if (profileForm.account_number && profileForm.bank_code) {
        if (profileForm.account_number !== profile?.account_number || profileForm.bank_code !== profile?.bank_code) {
          setVerifyingBank(true);
          const { data, error } = await supabase.functions.invoke('verify-bank-details', {
            body: { account_number: profileForm.account_number, bank_code: profileForm.bank_code }
          });

          if (error || data?.error) {
            throw new Error(data?.error || error?.message || "Failed to verify bank details");
          }

          if (data?.account_name?.toLowerCase() !== profileForm.name.toLowerCase()) {
            toast.warning(`Bank name mismatch: Found '${data.account_name}'. Expected '${profileForm.name}'`);
            throw new Error(`Account name mismatch. Bank returned: ${data.account_name}. Must match your profile name exactly.`);
          }
          toast.success("Bank details verified securely");
        }
      }

      const bankChanged =
        profileForm.account_number !== profile?.account_number ||
        profileForm.bank_code !== profile?.bank_code;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = { ...profileForm, social_links: profileForm.social_links };
      if (bankChanged) {
        payload.security_locked_until = new Date(Date.now() + 86400000).toISOString();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateProfile.mutateAsync(payload as any);
      toast.success("Profile saved!");
    } catch (err: unknown) {
      toast.error(getFriendlyError(err, "Failed to save"));
    } finally {
      setVerifyingBank(false);
    }
  };

  const handleSaveSecurity = async () => {
    if (!securityForm.transaction_pin) {
      toast.error("Please enter a 4-digit PIN");
      return;
    }
    if (!/^\d{4}$/.test(securityForm.transaction_pin)) {
      toast.error("PIN must be exactly 4 digits");
      return;
    }

    try {
      // PIN is hashed server-side (salted PBKDF2) in the edge function — the raw
      // PIN never lands in the DB and is never hashed in the browser.
      const { data, error } = await supabase.functions.invoke('set-transaction-pin', {
        body: { pin: securityForm.transaction_pin },
      });
      if (error) throw new Error(error.message || "Failed to save PIN");
      if (data?.error) throw new Error(data.error);

      setSecurityForm({ transaction_pin: "" });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Security settings updated! 24-hr cool-off period initiated for withdrawals.");
    } catch (err: unknown) { toast.error(getFriendlyError(err, "Failed to save security settings")); }
  };

  const handleSaveShop = async () => {
    if (!shopForm.shop_slug) { toast.error("Please set a shop URL slug"); return; }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateProfile.mutateAsync({ shop_name: shopForm.shop_name, shop_slug: shopForm.shop_slug, bio: shopForm.bio } as any);
      toast.success("Shop settings saved!");
    } catch (err: unknown) { toast.error(getFriendlyError(err, "Failed to save")); }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    try { await uploadAvatar.mutateAsync(file); toast.success("Avatar updated!"); }
    catch (err: unknown) { toast.error(getFriendlyError(err, "Failed to upload avatar")); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/logo.${ext}`;
      const logoUrl = await uploadFileToR2("shop-logos", path, file);
      const shop_logo_url = logoUrl + "?t=" + Date.now();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateProfile.mutateAsync({ shop_logo_url } as any);
      toast.success("Shop logo updated!");
    } catch (err: unknown) { toast.error(getFriendlyError(err, "Failed to upload logo")); }
    finally { setUploadingLogo(false); }
  };

  const handleIdDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
    setUploadingDoc(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/id-doc.${ext}`;
      const uploadedPath = await uploadFileToR2("verification-docs", path, file);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateProfile.mutateAsync({ id_document_url: uploadedPath, verification_status: "pending" } as any);
      toast.success("ID document uploaded! Verification pending.");
    } catch (err: unknown) { toast.error(getFriendlyError(err, "Failed to upload document")); }
    finally { setUploadingDoc(false); }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const initials = (profile?.name || "").split(" ").map(n => n[0]).join("").toUpperCase() || "?";
  const isVerified = profile?.verification_status === "verified";
  const isPendingVerification = profile?.verification_status === "pending";
  const needsIdUpload = ["student", "corporate", "nysc"].includes(profileForm.account_type);
  const accountTypeLabels: Record<string, string> = {
    student: "Student", nysc: "NYSC Member", graduate: "Fresh Graduate",
    corporate: "Corporate", creator: "Creator / Influencer",
  };

  const ProfileField = ({ label, icon: Icon, name, type = "text", maxLength, placeholder = "" }: { label: string; icon: React.ComponentType<{ className?: string }>; name: keyof typeof profileForm; type?: string; maxLength?: number; placeholder?: string }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2"><Icon className="h-3 w-3 text-muted-foreground" /> {label}</label>
      <Input type={type} maxLength={maxLength} placeholder={placeholder} value={profileForm[name] as string} onChange={(e) => setProfileForm({ ...profileForm, [name]: e.target.value })} className="bg-secondary border-border" />
    </div>
  );

  const isUnverified = !isVerified && !isPendingVerification;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-display flex items-center gap-2">
          <Settings className="h-6 w-6" /> VoltSquad Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your VoltSquad profile, shop, and security</p>
      </div>

      {isUnverified && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
          <CircleAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-warning">Identity Not Verified</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your identity has not been verified. Please upload your ID document below to get verified and unlock full features.
            </p>
          </div>
        </div>
      )}

      <Card className="border-border/50">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <Avatar className="h-16 w-16 text-2xl">
              {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.name} /> : null}
              <AvatarFallback className="bg-primary/20 text-primary font-bold font-display text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadAvatar.isPending ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {isUnverified && (
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-warning border-2 border-background" title="Unverified" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-lg">{profile?.name || "—"}</p>
              {isVerified && <ShieldCheck className="h-4 w-4 text-primary" />}
              {isUnverified && <Badge variant="outline" className="text-warning border-warning/30 text-[10px] px-1.5 py-0">Unverified</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{profile?.university || "—"}</p>
            <p className="text-xs text-primary font-medium mt-1">Tier: {profile?.tier || "Bronze"}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="w-full">
          <TabsTrigger value="profile" className="flex-1"><User className="h-3.5 w-3.5 mr-1.5" /> Profile</TabsTrigger>
          <TabsTrigger value="shop" className="flex-1"><Store className="h-3.5 w-3.5 mr-1.5" /> My Shop</TabsTrigger>
          <TabsTrigger value="security" className="flex-1 hidden sm:flex"><Lock className="h-3.5 w-3.5 mr-1.5" /> Security</TabsTrigger>
        </TabsList>

        {/* ─── PROFILE TAB ─── */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-base font-display font-semibold">Personal Information</h3>
              <ProfileField label="Full Name" icon={User} name="name" />
              <ProfileField label="Email" icon={User} name="email" type="email" />
              <ProfileField label="WhatsApp Number" icon={Phone} name="whatsapp" type="tel" />
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-base font-display font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Verification
              </h3>

              {isVerified && (
                <Badge className="bg-primary/10 text-primary border-primary/20"><ShieldCheck className="h-3 w-3 mr-1" /> Verified</Badge>
              )}
              {isPendingVerification && (
                <Badge variant="outline" className="text-warning border-warning/30"><CircleAlert className="h-3 w-3 mr-1" /> Pending Verification</Badge>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Account Type</label>
                <Select value={profileForm.account_type || ""} onValueChange={(val) => setProfileForm({ ...profileForm, account_type: val })}>
                  <SelectTrigger className="bg-secondary border-border w-full md:w-1/2">
                    <SelectValue placeholder="Select Account Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(accountTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {needsIdUpload && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Upload {profileForm.account_type === "student" ? "Student ID" : profileForm.account_type === "nysc" ? "NYSC ID / Call-up Letter" : "Corporate ID"}
                  </label>
                  <div className="flex items-center gap-3">
                    <Button size="sm" variant="outline" onClick={() => idDocInputRef.current?.click()} disabled={uploadingDoc}>
                      {uploadingDoc ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                      {profile?.id_document_url ? "Re-upload" : "Upload ID"}
                    </Button>
                    {profile?.id_document_url && <span className="text-xs text-muted-foreground">Document uploaded</span>}
                    <input ref={idDocInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdDocUpload} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-display font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> KYC Verification (Required for payouts)
                </h3>
                {profile?.nin && profile?.bvn && profile?.proof_of_address_url ? (
                  <Badge className="bg-primary/10 text-primary border-primary/20"><ShieldCheck className="h-3 w-3 mr-1" /> Verified</Badge>
                ) : (
                  <Badge variant="outline" className="text-warning border-warning/30"><CircleAlert className="h-3 w-3 mr-1" /> Action Required</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Your NIN, BVN, and Proof of Address are required before you can request any withdrawals.
              </p>
              <Button variant="outline" onClick={() => setKycOpen(true)}>
                {profile?.nin && profile?.bvn && profile?.proof_of_address_url ? "Update KYC Details" : "Complete KYC Details"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-base font-display font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4" /> Social Links
              </h3>
              <div className="space-y-3">
                {[
                  { key: "tiktok" as const, label: "TikTok", icon: AtSign },
                  { key: "snapchat" as const, label: "Snapchat", icon: AtSign },
                  { key: "instagram" as const, label: "Instagram", icon: Instagram },
                  { key: "twitter" as const, label: "Twitter / X", icon: AtSign },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-sm font-medium flex items-center gap-1.5"><Icon className="h-3 w-3 text-muted-foreground" /> {label}</label>
                    <Input
                      value={profileForm.social_links[key]}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        social_links: { ...profileForm.social_links, [key]: e.target.value },
                      })}
                      placeholder={`Your ${label} link or handle`}
                      className="bg-secondary border-border"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-base font-display font-semibold">Payout Details</h3>
                {profileForm.bank_account_verified ? (
                  <Badge className="bg-success/10 text-success border-success/20 font-medium"><ShieldCheck className="h-3 w-3 mr-1" /> Verified</Badge>
                ) : (
                  <Badge variant="outline" className="text-warning border-warning/30 font-medium"><CircleAlert className="h-3 w-3 mr-1" /> Unverified</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                You must ensure that the name on your bank account exactly matches your verified profile name.
                {!profileForm.bank_account_verified && (
                  <span className="text-warning block mt-1 font-medium">Bank details must be verified by an admin before payouts can be requested.</span>
                )}
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2"><CreditCard className="h-3 w-3 text-muted-foreground" /> Bank Name</label>
                <Select value={profileForm.bank_code} onValueChange={(val) => setProfileForm(prev => ({
                  ...prev,
                  bank_code: val,
                  bank_name: BANK_NAMES[val] ?? val,
                }))}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select or type Bank Name" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="044">Access Bank</SelectItem>
                    <SelectItem value="011">First Bank</SelectItem>
                    <SelectItem value="058">Guaranty Trust Bank (GTB)</SelectItem>
                    <SelectItem value="033">United Bank for Africa (UBA)</SelectItem>
                    <SelectItem value="057">Zenith Bank</SelectItem>
                    <SelectItem value="032">Union Bank</SelectItem>
                    <SelectItem value="214">FCMB</SelectItem>
                    <SelectItem value="070">Fidelity Bank</SelectItem>
                    <SelectItem value="050">Ecobank</SelectItem>
                    <SelectItem value="082">Keystone Bank</SelectItem>
                    <SelectItem value="215">Unity Bank</SelectItem>
                    <SelectItem value="035">Wema Bank</SelectItem>
                    <SelectItem value="030">Heritage Bank</SelectItem>
                    <SelectItem value="232">Sterling Bank</SelectItem>
                    <SelectItem value="076">Polaris Bank</SelectItem>
                    <SelectItem value="100004">Opay</SelectItem>
                    <SelectItem value="090267">Kuda Bank</SelectItem>
                    <SelectItem value="100033">Palmpay</SelectItem>
                    <SelectItem value="090328">Moniepoint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ProfileField label="Account Number" icon={CreditCard} name="account_number" maxLength={10} placeholder="e.g 0123456789" />
            </CardContent>
          </Card>

          <Button onClick={handleSaveProfile} className="volt-gradient w-full sm:w-auto" disabled={updateProfile.isPending || verifyingBank}>
            {verifyingBank || updateProfile.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {verifyingBank ? "Verifying Bank..." : updateProfile.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </TabsContent>

        {/* ─── SECURITY TAB ─── */}
        <TabsContent value="security" className="space-y-4">
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-5 w-5 text-primary" />
                <h3 className="text-base font-display font-semibold">Transaction PIN</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Set a 4-digit PIN required to make withdrawals. Changes trigger a 24-hour security cool-off period.
              </p>

              <div className="space-y-2 mt-4 max-w-xs">
                <label className="text-sm font-medium">New 4-Digit PIN</label>
                <Input
                  type="password"
                  maxLength={4}
                  value={securityForm.transaction_pin}
                  onChange={(e) => setSecurityForm({ ...securityForm, transaction_pin: e.target.value })}
                  placeholder="****"
                  className="font-mono tracking-widest text-lg h-12"
                />
              </div>

              {profile?.security_locked_until && new Date(profile.security_locked_until) > new Date() && (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 flex items-start gap-2 mt-4 text-warning text-xs">
                  <Lock className="h-4 w-4 shrink-0" />
                  <p>Your wallet is in a 24-hour security cool-off period until {new Date(profile.security_locked_until).toLocaleString()}. Withdrawals are temporarily disabled.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleSaveSecurity} className="volt-gradient w-full sm:w-auto" disabled={updateProfile.isPending}>
            <Save className="h-4 w-4 mr-2" /> Save PIN
          </Button>

          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <QrCode className="h-5 w-5 text-primary" />
                <h3 className="text-base font-display font-semibold">Two-Factor Authentication (Recommended)</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Enhance your account and wallet security by requiring a 6-digit code from an authenticator app.
              </p>

              <div className="pt-2">
                <MfaSetup />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── MY SHOP TAB ─── */}
        <TabsContent value="shop" className="space-y-4">
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-display font-semibold flex items-center gap-2"><Store className="h-4 w-4" /> Shop Details</h3>
                <Badge variant={isShopLive ? "default" : "outline"} className={isShopLive ? "bg-green-500/15 text-green-600 border-green-500/30 text-xs" : "text-xs"}>
                  {isShopLive ? <><CircleCheck className="h-3 w-3 mr-1" /> Live</> : <><CircleAlert className="h-3 w-3 mr-1" /> Not set up</>}
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Shop Logo / Picture</label>
                <div className="flex items-center gap-4">
                  {profile?.shop_logo_url ? (
                    <img src={profile.shop_logo_url} alt="Shop logo" className="h-16 w-16 rounded-lg object-cover border border-border" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center border border-dashed border-border">
                      <Store className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <Button size="sm" variant="outline" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                    {uploadingLogo ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                    {profile?.shop_logo_url ? "Change Logo" : "Upload Logo"}
                  </Button>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Shop Name</label>
                <Input value={shopForm.shop_name} onChange={(e) => setShopForm({ ...shopForm, shop_name: e.target.value })} placeholder="e.g. Ada's Picks" className="bg-secondary border-border" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Shop URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">/s/</span>
                  <Input value={shopForm.shop_slug} onChange={(e) => { setSlugTouched(true); setShopForm({ ...shopForm, shop_slug: toSlug(e.target.value) }); }} placeholder="my-shop" className="bg-secondary border-border font-mono text-sm" />
                </div>
                {shopSlug && <p className="text-xs text-muted-foreground font-mono truncate">{window.location.origin}/s/{shopSlug}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <Textarea value={shopForm.bio} onChange={(e) => setShopForm({ ...shopForm, bio: e.target.value })} placeholder="Tell buyers about yourself..." className="bg-secondary border-border resize-none" rows={3} />
              </div>

              {shopSlug && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(shopLink, "Shop link")}><Copy className="h-3 w-3 mr-1.5" /> Copy Link</Button>
                  <Button size="sm" variant="outline" asChild><a href={`/s/${shopSlug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1.5" /> Preview</a></Button>
                  <Button size="sm" variant="outline" onClick={() => { if (navigator.share) navigator.share({ title: shopForm.shop_name || "My Shop", url: shopLink }); else copyToClipboard(shopLink, "Shop link"); }}><Link2 className="h-3 w-3 mr-1.5" /> Share</Button>
                  <Button size="sm" variant="outline" asChild><Link to="/talent/voltsquad/marketplace"><ShoppingBag className="h-3 w-3 mr-1.5" /> Add Products</Link></Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6 space-y-3">
              <h3 className="text-base font-display font-semibold">Shop Products{shopProducts.length > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">({shopProducts.length})</span>}</h3>
              {shopProducts.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center border border-dashed border-border rounded-lg">
                  <Store className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">Add products from the marketplace</p>
                  <Button size="sm" variant="default" className="volt-gradient" asChild><Link to="/talent/voltsquad/marketplace"><ShoppingBag className="h-3.5 w-3.5 mr-1.5" /> Browse Marketplace</Link></Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {shopProducts.map((p) => {
                    const productLink = `${window.location.origin}/product/${p.slug}?ref=${referralCode}`;
                    return (
                      <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card">
                        {(p as any).assets?.images?.[0] ? (
                          <img src={(p as any).assets.images[0]} alt={p.name} className="h-12 w-12 rounded-md object-cover flex-shrink-0" />
                        ) : (
                          <span className="text-2xl flex-shrink-0">{p.image}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{p.brand}</span>
                            {p.price > 0 && <><span className="text-xs text-muted-foreground">•</span><span className="text-xs font-medium">{formatNaira(p.price)}</span></>}
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs font-semibold text-primary">{p.commissionRate}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => copyToClipboard(productLink, "Product link")}><Copy className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="text-destructive h-8 w-8 p-0" onClick={() => { removeFromShop.mutate(p.id, { onSuccess: () => toast.success(`Removed ${p.name}`) }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleSaveShop} className="volt-gradient w-full sm:w-auto" disabled={updateProfile.isPending}>
            <Save className="h-4 w-4 mr-2" /> {updateProfile.isPending ? "Saving..." : "Save Shop Settings"}
          </Button>
        </TabsContent>
      </Tabs>
      <KYCModal open={kycOpen} onOpenChange={setKycOpen} />
    </div>
  );
};

export default VoltSquadSettings;
