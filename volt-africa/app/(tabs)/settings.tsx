import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl,
  Alert, ActivityIndicator, Image, Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/AppHeader";

type ProfileTab = "Profile" | "My Shop";

const ACCOUNT_TYPES = ["student", "nysc", "graduate", "corporate", "creator"];
const SOCIAL_PLATFORMS = ["TikTok", "Snapchat", "Instagram", "Twitter / X"];
const SOCIAL_KEYS = ["tiktok", "snapchat", "instagram", "twitter"];
const BANKS = [
  "Access Bank", "First Bank", "GTBank", "UBA", "Zenith Bank", "Union Bank",
  "FCMB", "Fidelity Bank", "Ecobank", "Keystone Bank", "Unity Bank", "Wema Bank",
  "Opay", "Kuda Bank", "PalmPay", "Moniepoint",
];

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("Profile");
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", whatsapp: "", account_type: "", bank_name: "", account_number: "",
    nin: "", bvn: "", tiktok: "", snapchat: "", instagram: "", twitter: "",
  });
  const [shopForm, setShopForm] = useState({ shop_name: "", shop_slug: "", bio: "" });
  const [kyc, setKyc] = useState<any>(null);
  const [proofOfAddressUri, setProofOfAddressUri] = useState<string | null>(null);
  const [shopLogoUri, setShopLogoUri] = useState<string | null>(null);
  const [shopLogoUrl, setShopLogoUrl] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingKyc, setUploadingKyc] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [initials, setInitials] = useState("V");

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile(prof);
    if (prof) {
      const social = prof.social_links || {};
      setForm({
        name: prof.name || "", whatsapp: prof.whatsapp || "",
        account_type: prof.account_type || "", bank_name: prof.bank_name || "",
        account_number: prof.account_number || "", nin: prof.nin || "", bvn: prof.bvn || "",
        tiktok: social.tiktok || "", snapchat: social.snapchat || "",
        instagram: social.instagram || "", twitter: social.twitter || "",
      });
      setShopForm({ shop_name: prof.shop_name || "", shop_slug: prof.shop_slug || "", bio: prof.bio || "" });
      if (prof.shop_logo_url) setShopLogoUrl(prof.shop_logo_url);
      if (prof.name) {
        const parts = prof.name.trim().split(" ");
        setInitials(parts.map((p: string) => p[0]).join("").toUpperCase().slice(0, 2));
      }
    }
    const { data: kycData } = await supabase.from("kyc_submissions").select("*").eq("user_id", user.id).single();
    setKyc(kycData);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const pickImage = async (onPicked: (uri: string) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Please allow photo access."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets[0]) onPicked(result.assets[0].uri);
  };

  const uploadFile = async (uri: string, bucket: string, path: string): Promise<string | null> => {
    const ext = uri.split(".").pop() || "jpg";
    const response = await fetch(uri);
    const blob = await response.blob();
    const contentType = `image/${ext}`;

    const { data, error: invokeError } = await supabase.functions.invoke("r2-storage", {
      body: { bucket, key: path, action: "upload", contentType },
    });

    if (invokeError || !data) {
      throw new Error(invokeError?.message || "Failed to generate presigned R2 URL");
    }

    const { url, publicUrl } = data;

    const uploadResponse = await fetch(url, {
      method: "PUT",
      body: blob,
      headers: {
        "Content-Type": contentType,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload to Cloudflare R2: ${uploadResponse.statusText}`);
    }

    const PUBLIC_BUCKETS = ["avatars", "shop-logos", "product-images", "brand-assets", "talent-assets"];
    if (PUBLIC_BUCKETS.includes(bucket)) {
      return publicUrl || path;
    }
    return path;
  };

  const submitKyc = async () => {
    if (!form.nin || !form.bvn) return Alert.alert("Error", "Please enter your NIN and BVN");
    if (!proofOfAddressUri && !profile?.proof_of_address_url) return Alert.alert("Error", "Please upload a proof of address");
    if (!user) return;

    setUploadingKyc(true);
    try {
      let proofUrl = profile?.proof_of_address_url || null;
      if (proofOfAddressUri) {
        proofUrl = await uploadFile(proofOfAddressUri, "kyc-documents", `${user.id}/proof_of_address-${Date.now()}.jpg`);
      }
      await supabase.from("profiles").update({ nin: form.nin, bvn: form.bvn, proof_of_address_url: proofUrl }).eq("id", user.id);
      Alert.alert("Submitted", "KYC details submitted successfully!");
      fetchData();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit KYC");
    } finally {
      setUploadingKyc(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from("profiles").update({
        name: form.name, whatsapp: form.whatsapp, account_type: form.account_type,
        bank_name: form.bank_name, account_number: form.account_number,
        social_links: { tiktok: form.tiktok, snapchat: form.snapchat, instagram: form.instagram, twitter: form.twitter },
      }).eq("id", user.id);
      Alert.alert("Saved", "Profile updated successfully.");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveShop = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let logoUrl = shopLogoUrl;
      if (shopLogoUri) {
        setUploadingLogo(true);
        logoUrl = await uploadFile(shopLogoUri, "shop-logos", `${user.id}/logo-${Date.now()}.jpg`);
        setShopLogoUrl(logoUrl);
        setShopLogoUri(null);
        setUploadingLogo(false);
      }
      await supabase.from("profiles").update({ shop_name: shopForm.shop_name, shop_slug: shopForm.shop_slug, bio: shopForm.bio, shop_logo_url: logoUrl }).eq("id", user.id);
      Alert.alert("Saved", "Shop settings saved.");
    } catch (err: any) {
      Alert.alert("Error", err.message);
      setUploadingLogo(false);
    } finally {
      setSaving(false);
    }
  };

  const copyShopLink = async () => {
    const link = `https://www.tryvoltapp.com/s/${shopForm.shop_slug || profile?.shop_slug || "your-shop"}`;
    await Clipboard.setStringAsync(link);
    Alert.alert("Copied", "Shop link copied to clipboard!");
  };

  const shareShopLink = async () => {
    const link = `https://www.tryvoltapp.com/s/${shopForm.shop_slug || profile?.shop_slug || "your-shop"}`;
    await Share.share({ message: `Check out my shop on Volt! ${link}` });
  };

  const isKycVerified = kyc?.status === "verified" || !!(profile?.nin && profile?.bvn && profile?.proof_of_address_url);
  const tierColor = "#cd7f32";

  const inputStyle = { backgroundColor: "#27272a", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, color: "#fafafa", fontSize: 13 };

  return (
    <View style={{ flex: 1, backgroundColor: "#09090b" }}>
      <AppHeader />
      <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="settings-outline" size={20} color="#fafafa" />
          <Text style={{ color: "#fafafa", fontSize: 22, fontWeight: "700" }}>Settings</Text>
        </View>
        <Text style={{ color: "#71717a", fontSize: 13, paddingHorizontal: 16, marginTop: 2, marginBottom: 16 }}>Manage your profile and shop</Text>

        {/* KYC warning */}
        {!isKycVerified && (
          <View style={{ marginHorizontal: 16, backgroundColor: "rgba(245,158,11,0.1)", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)", borderRadius: 12, padding: 14, marginBottom: 16, flexDirection: "row", gap: 10 }}>
            <Ionicons name="alert-circle-outline" size={18} color="#f59e0b" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#f59e0b", fontWeight: "700", fontSize: 13 }}>Identity Not Verified</Text>
              <Text style={{ color: "#a1a1aa", fontSize: 12, marginTop: 2 }}>Upload your ID document in KYC Verification below to unlock full features.</Text>
            </View>
          </View>
        )}

        {/* Avatar + name */}
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <View style={{ position: "relative" }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#1d4ed8", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700" }}>{initials}</Text>
            </View>
            <View style={{ position: "absolute", bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: isKycVerified ? "#4ade80" : "#f59e0b", borderWidth: 2, borderColor: "#09090b" }} />
          </View>
          <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "700", marginTop: 8 }}>{profile?.name || "—"}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
            <Text style={{ color: "#71717a", fontSize: 12 }}>{profile?.university || ""}</Text>
            <View style={{ borderWidth: 1, borderColor: isKycVerified ? "#4ade80" : "#f59e0b", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: isKycVerified ? "#4ade80" : "#f59e0b", fontSize: 10 }}>{isKycVerified ? "Verified" : "Unverified"}</Text>
            </View>
          </View>
          <Text style={{ color: tierColor, fontSize: 12, fontWeight: "600", marginTop: 2 }}>Tier: Bronze</Text>
        </View>

        {/* Tab switcher */}
        <View style={{ marginHorizontal: 16, flexDirection: "row", backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
          {(["Profile", "My Shop"] as ProfileTab[]).map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={{ flex: 1, paddingVertical: 11, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6, backgroundColor: activeTab === tab ? "#27272a" : "transparent" }}>
              <Ionicons name={tab === "Profile" ? "person-outline" : "storefront-outline"} size={14} color={activeTab === tab ? "#fafafa" : "#71717a"} />
              <Text style={{ color: activeTab === tab ? "#fafafa" : "#71717a", fontSize: 13, fontWeight: "600" }}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {activeTab === "Profile" ? (
            <>
              {/* Personal Info */}
              <Section title="Personal Information">
                <Field icon="person-outline" label="Full Name" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
                <Field icon="mail-outline" label="Email" value={user?.email || ""} editable={false} />
                <Field icon="logo-whatsapp" label="WhatsApp Number" value={form.whatsapp} onChangeText={(v) => setForm((f) => ({ ...f, whatsapp: v }))} keyboardType="phone-pad" />
              </Section>

              {/* Verification */}
              <Section title="Verification">
                <Text style={{ color: "#71717a", fontSize: 12, marginBottom: 8 }}>Account Type</Text>
                <TouchableOpacity onPress={() => setShowTypePicker(!showTypePicker)} style={{ backgroundColor: "#27272a", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", marginBottom: showTypePicker ? 4 : 0 }}>
                  <Text style={{ color: form.account_type ? "#fafafa" : "#71717a", fontSize: 13 }}>{form.account_type ? form.account_type.charAt(0).toUpperCase() + form.account_type.slice(1) : "Select account type"}</Text>
                  <Ionicons name="chevron-down" size={16} color="#71717a" />
                </TouchableOpacity>
                {showTypePicker && (
                  <View style={{ backgroundColor: "#27272a", borderRadius: 10 }}>
                    {ACCOUNT_TYPES.map((t) => (
                      <TouchableOpacity key={t} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: "#18181b" }} onPress={() => { setForm((f) => ({ ...f, account_type: t })); setShowTypePicker(false); }}>
                        <Text style={{ color: "#fafafa", fontSize: 13 }}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </Section>

              {/* KYC */}
              <Section title="KYC Verification" titleExtra={
                isKycVerified
                  ? <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(34,197,94,0.15)", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Ionicons name="checkmark-circle" size={12} color="#4ade80" />
                      <Text style={{ color: "#4ade80", fontSize: 11, fontWeight: "600" }}>Verified</Text>
                    </View>
                  : <View style={{ flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#f59e0b", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Ionicons name="alert-circle-outline" size={12} color="#f59e0b" />
                      <Text style={{ color: "#f59e0b", fontSize: 11, fontWeight: "600" }}>Required</Text>
                    </View>
              }>
                <Text style={{ color: "#71717a", fontSize: 12, marginBottom: 12 }}>Your NIN, BVN, and Proof of Address are required before you can request any withdrawals.</Text>

                <Text style={{ color: "#a1a1aa", fontSize: 12, marginBottom: 6 }}>NIN (National Identity Number)</Text>
                <TextInput style={[inputStyle, { marginBottom: 12 }]} placeholder="Enter your 11-digit NIN" placeholderTextColor="#71717a" value={form.nin} onChangeText={(v) => setForm((f) => ({ ...f, nin: v }))} keyboardType="numeric" maxLength={11} />

                <Text style={{ color: "#a1a1aa", fontSize: 12, marginBottom: 6 }}>BVN (Bank Verification Number)</Text>
                <TextInput style={[inputStyle, { marginBottom: 12 }]} placeholder="Enter your 11-digit BVN" placeholderTextColor="#71717a" value={form.bvn} onChangeText={(v) => setForm((f) => ({ ...f, bvn: v }))} keyboardType="numeric" maxLength={11} />

                <Text style={{ color: "#a1a1aa", fontSize: 12, marginBottom: 6 }}>Proof of Address (Utility Bill / Bank Statement)</Text>
                <TouchableOpacity
                  onPress={() => pickImage(setProofOfAddressUri)}
                  style={{ backgroundColor: "#27272a", borderRadius: 10, padding: 14, alignItems: "center", borderWidth: 1, borderStyle: "dashed", borderColor: (proofOfAddressUri || profile?.proof_of_address_url) ? "#3b82f6" : "#52525b", marginBottom: 12 }}
                >
                  {proofOfAddressUri ? (
                    <View style={{ alignItems: "center", gap: 8 }}>
                      <Image source={{ uri: proofOfAddressUri }} style={{ width: 100, height: 100, borderRadius: 8 }} />
                      <Text style={{ color: "#3b82f6", fontSize: 12 }}>Tap to change</Text>
                    </View>
                  ) : profile?.proof_of_address_url ? (
                    <View style={{ alignItems: "center", gap: 6 }}>
                      <Ionicons name="checkmark-circle" size={24} color="#4ade80" />
                      <Text style={{ color: "#4ade80", fontSize: 13 }}>Document uploaded — tap to replace</Text>
                    </View>
                  ) : (
                    <View style={{ alignItems: "center", gap: 6 }}>
                      <Ionicons name="cloud-upload-outline" size={24} color="#71717a" />
                      <Text style={{ color: "#71717a", fontSize: 13 }}>Tap to upload document</Text>
                      <Text style={{ color: "#52525b", fontSize: 11 }}>Images only · max 5MB</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={submitKyc} disabled={uploadingKyc} style={{ backgroundColor: "#27272a", borderRadius: 10, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
                  {uploadingKyc ? <ActivityIndicator size="small" color="#3b82f6" /> : <Ionicons name="shield-checkmark-outline" size={16} color="#3b82f6" />}
                  <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}>{uploadingKyc ? "Submitting..." : "Submit KYC Details"}</Text>
                </TouchableOpacity>
              </Section>

              {/* Social Links */}
              <Section title="Social Links">
                {SOCIAL_PLATFORMS.map((platform, i) => (
                  <View key={platform} style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <Ionicons name="at-outline" size={14} color="#71717a" />
                      <Text style={{ color: "#71717a", fontSize: 12 }}>{platform}</Text>
                    </View>
                    <TextInput style={inputStyle} placeholder={`Your ${platform} handle or link`} placeholderTextColor="#71717a" value={(form as any)[SOCIAL_KEYS[i]]} onChangeText={(v) => setForm((f) => ({ ...f, [SOCIAL_KEYS[i]]: v }))} />
                  </View>
                ))}
              </Section>

              {/* Payout Details */}
              <Section title="Payout Details" titleExtra={
                profile?.bank_name && profile?.account_number
                  ? <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(34,197,94,0.15)", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ade80" }} />
                      <Text style={{ color: "#4ade80", fontSize: 11, fontWeight: "600" }}>On file</Text>
                    </View>
                  : <View style={{ flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: "#71717a", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ color: "#71717a", fontSize: 11 }}>Not set</Text>
                    </View>
              }>
                <Text style={{ color: "#ef4444", fontSize: 11, marginBottom: 10 }}>Bank details must be verified by an admin before payouts can be requested.</Text>
                <Text style={{ color: "#a1a1aa", fontSize: 12, marginBottom: 6 }}>Bank Name</Text>
                <TouchableOpacity onPress={() => setShowBankPicker(!showBankPicker)} style={{ backgroundColor: "#27272a", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                  <Text style={{ color: form.bank_name ? "#fafafa" : "#71717a", fontSize: 13 }}>{form.bank_name || "Select Bank"}</Text>
                  <Ionicons name="chevron-down" size={16} color="#71717a" />
                </TouchableOpacity>
                {showBankPicker && (
                  <View style={{ backgroundColor: "#27272a", borderRadius: 10, marginBottom: 10, maxHeight: 180 }}>
                    <ScrollView>
                      {BANKS.map((b) => (
                        <TouchableOpacity key={b} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: "#18181b" }} onPress={() => { setForm((f) => ({ ...f, bank_name: b })); setShowBankPicker(false); }}>
                          <Text style={{ color: "#fafafa", fontSize: 13 }}>{b}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                <Text style={{ color: "#a1a1aa", fontSize: 12, marginBottom: 6 }}>Account Number</Text>
                <TextInput style={inputStyle} placeholder="e.g 0123456789" placeholderTextColor="#71717a" value={form.account_number} onChangeText={(v) => setForm((f) => ({ ...f, account_number: v }))} keyboardType="numeric" />
              </Section>

              <TouchableOpacity onPress={saveProfile} disabled={saving} style={{ marginBottom: 32, borderRadius: 12, overflow: "hidden" }}>
                <View style={{ backgroundColor: saving ? "#27272a" : "#3b82f6", borderRadius: 12, paddingVertical: 15, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="save-outline" size={16} color="#fff" />}
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{saving ? "Saving..." : "Save Profile"}</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Shop Details */}
              <Section title="Shop Details" titleExtra={
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(34,197,94,0.15)", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ade80" }} />
                  <Text style={{ color: "#4ade80", fontSize: 11, fontWeight: "600" }}>Live</Text>
                </View>
              }>
                <Text style={{ color: "#a1a1aa", fontSize: 12, marginBottom: 8 }}>Shop Logo</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <View style={{ width: 56, height: 56, backgroundColor: "#27272a", borderRadius: 12, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {shopLogoUri || shopLogoUrl ? (
                      <Image source={{ uri: shopLogoUri || shopLogoUrl! }} style={{ width: 56, height: 56 }} />
                    ) : (
                      <Ionicons name="storefront-outline" size={24} color="#71717a" />
                    )}
                  </View>
                  <TouchableOpacity onPress={() => pickImage((uri) => setShopLogoUri(uri))} style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#27272a", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}>
                    <Ionicons name="cloud-upload-outline" size={16} color="#fafafa" />
                    <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}>{shopLogoUri ? "Change Logo" : "Upload Logo"}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ color: "#a1a1aa", fontSize: 12, marginBottom: 6 }}>Shop Name</Text>
                <TextInput
                  style={[inputStyle, { marginBottom: 14 }]}
                  placeholder="e.g. Ada's Picks"
                  placeholderTextColor="#71717a"
                  value={shopForm.shop_name}
                  onChangeText={(v) => setShopForm((f) => ({ ...f, shop_name: v, shop_slug: v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }))}
                />

                <Text style={{ color: "#a1a1aa", fontSize: 12, marginBottom: 6 }}>Shop URL Slug</Text>
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#27272a", borderRadius: 10, paddingHorizontal: 14, marginBottom: 4, gap: 6 }}>
                  <Text style={{ color: "#71717a", fontSize: 13 }}>/s/</Text>
                  <TextInput style={{ flex: 1, paddingVertical: 11, color: "#fafafa", fontSize: 13 }} value={shopForm.shop_slug} onChangeText={(v) => setShopForm((f) => ({ ...f, shop_slug: v }))} autoCapitalize="none" />
                </View>
                <Text style={{ color: "#71717a", fontSize: 11, marginBottom: 16 }}>tryvoltapp.com/s/{shopForm.shop_slug || "your-shop"}</Text>

                <Text style={{ color: "#a1a1aa", fontSize: 12, marginBottom: 6 }}>Bio</Text>
                <TextInput style={[inputStyle, { height: 90, textAlignVertical: "top", marginBottom: 16 }]} placeholder="Tell buyers about yourself..." placeholderTextColor="#71717a" value={shopForm.bio} onChangeText={(v) => setShopForm((f) => ({ ...f, bio: v }))} multiline />

                <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                  <TouchableOpacity onPress={copyShopLink} style={{ flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#27272a", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 }}>
                    <Ionicons name="copy-outline" size={14} color="#a1a1aa" />
                    <Text style={{ color: "#a1a1aa", fontSize: 12, fontWeight: "600" }}>Copy Link</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={shareShopLink} style={{ flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#27272a", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 }}>
                    <Ionicons name="share-social-outline" size={14} color="#a1a1aa" />
                    <Text style={{ color: "#a1a1aa", fontSize: 12, fontWeight: "600" }}>Share</Text>
                  </TouchableOpacity>
                </View>
              </Section>

              <TouchableOpacity onPress={saveShop} disabled={saving || uploadingLogo} style={{ marginBottom: 16, borderRadius: 12 }}>
                <View style={{ backgroundColor: (saving || uploadingLogo) ? "#27272a" : "#3b82f6", borderRadius: 12, paddingVertical: 15, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
                  {(saving || uploadingLogo) ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="save-outline" size={16} color="#fff" />}
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{saving || uploadingLogo ? "Saving..." : "Save Shop Settings"}</Text>
                </View>
              </TouchableOpacity>

              {/* Sign out */}
              <TouchableOpacity onPress={() => Alert.alert("Sign Out", "Are you sure you want to sign out?", [{ text: "Cancel", style: "cancel" }, { text: "Sign Out", style: "destructive", onPress: () => signOut() }])} style={{ marginBottom: 32 }}>
                <View style={{ backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", borderRadius: 12, paddingVertical: 15, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
                  <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                  <Text style={{ color: "#ef4444", fontWeight: "700", fontSize: 15 }}>Sign Out</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ title, children, titleExtra }: { title: string; children: React.ReactNode; titleExtra?: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", borderRadius: 12, padding: 14, marginBottom: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ color: "#fafafa", fontWeight: "700", fontSize: 14 }}>{title}</Text>
        {titleExtra}
      </View>
      {children}
    </View>
  );
}

function Field({ icon, label, value, onChangeText, editable = true, keyboardType }: {
  icon: string; label: string; value: string; onChangeText?: (v: string) => void; editable?: boolean; keyboardType?: any;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 5 }}>
        <Ionicons name={icon as any} size={14} color="#71717a" />
        <Text style={{ color: "#71717a", fontSize: 12 }}>{label}</Text>
      </View>
      <TextInput
        style={{ backgroundColor: "#27272a", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: editable ? "#fafafa" : "#71717a", fontSize: 13 }}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        placeholderTextColor="#71717a"
      />
    </View>
  );
}
