import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert,
  Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/AppHeader";

const TX_TABS = ["All", "Commissions", "Manual Sales", "Referral", "Payouts"] as const;
type TxTab = typeof TX_TABS[number];

const TX_TYPE_MAP: Record<TxTab, string[]> = {
  All: [],
  Commissions: ["commission"],
  "Manual Sales": ["manual_sale"],
  Referral: ["referral_bonus"],
  Payouts: ["payout"],
};

const TX_ICONS: Record<string, { icon: string; color: string }> = {
  commission: { icon: "trending-up-outline", color: "#4ade80" },
  referral_bonus: { icon: "people-outline", color: "#3b82f6" },
  signup_bonus: { icon: "gift-outline", color: "#f59e0b" },
  performance_bonus: { icon: "star-outline", color: "#f59e0b" },
  payout: { icon: "arrow-up-circle-outline", color: "#ef4444" },
  manual_sale: { icon: "cart-outline", color: "#8b5cf6" },
};

const MIN_PAYOUT = 1000;

// ─── Log a Sale Modal ────────────────────────────────────────────────────────
function LogSaleModal({ visible, onClose, onSuccess }: { visible: boolean; onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [customer, setCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      supabase.from("products").select("id,name,commission_rate,commission_type,commission_value,price,product_type").eq("is_active", true).then(({ data }) => setProducts(data || []));
    }
  }, [visible]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const isLead = selectedProduct?.product_type === "lead";
  const qty = parseInt(quantity) || 1;

  const calcCommission = () => {
    if (!selectedProduct) return 0;
    if (selectedProduct.commission_type === "percentage")
      return (selectedProduct.price || 0) * (selectedProduct.commission_rate / 100) * qty;
    return (selectedProduct.commission_value || 0) * qty;
  };

  const pickProof = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Please allow photo access to upload proof."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets[0]) setProofUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!selectedProductId) return Alert.alert("Error", "Select a product");
    if (!isLead && !customer.trim()) return Alert.alert("Error", "Enter customer name");
    if (!isLead && !proofUri) return Alert.alert("Error", "Upload proof of sale");
    if (!user) return;

    setSubmitting(true);
    try {
      let proofFileName: string | null = null;
      if (proofUri) {
        const ext = proofUri.split(".").pop() || "jpg";
        const fileName = `${user.id}/${Date.now()}_proof.${ext}`;
        const response = await fetch(proofUri);
        const blob = await response.blob();
        const contentType = `image/${ext}`;

        const { data, error: invokeError } = await supabase.functions.invoke("r2-storage", {
          body: {
            bucket: "sale-proofs",
            key: fileName,
            action: "upload",
            contentType,
          },
        });

        if (invokeError || !data) {
          throw new Error(invokeError?.message || "Failed to generate presigned R2 URL");
        }

        const { url } = data;

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

        proofFileName = fileName;
      }

      const commission = calcCommission();
      const { error: saleError } = await supabase.from("sales" as any).insert({
        user_id: user.id,
        user_id: user.id,
        product_id: selectedProductId,
        date: new Date().toISOString().split("T")[0],
        customer: isLead ? "Lead" : customer,
        quantity: isLead ? 1 : qty,
        amount: isLead ? 0 : (selectedProduct?.price || 0) * qty,
        commission_earned: isLead ? 0 : commission,
        status: "pending",
        proof_file_url: proofFileName,
        notes,
      } as any);
      if (saleError) throw saleError;

      if (!isLead) {
        await supabase.from("transactions" as any).insert({
          user_id: user.id,
          type: "manual_sale",
          description: `${selectedProduct?.name} x${qty} — ${customer}`,
          amount: commission,
          status: "pending",
        } as any);
      }

      Alert.alert("Submitted", isLead ? "Lead logged!" : "Sale submitted! Verification takes 3–7 working days.");
      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit sale");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedProductId(""); setQuantity("1"); setCustomer(""); setNotes(""); setProofUri(null); setShowProductPicker(false);
  };

  const inputStyle = { backgroundColor: "#27272a", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: "#fafafa", fontSize: 14 };
  const labelStyle = { color: "#a1a1aa", fontSize: 12, fontWeight: "600" as const, marginBottom: 6 };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#09090b" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#27272a" }}>
          <Text style={{ color: "#fafafa", fontSize: 18, fontWeight: "700" }}>{isLead ? "Log a Lead" : "Log a Sale"}</Text>
          <TouchableOpacity onPress={() => { resetForm(); onClose(); }}>
            <Ionicons name="close" size={24} color="#71717a" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
          <Text style={{ color: "#71717a", fontSize: 12 }}>
            {isLead ? "Record a lead/sign-up. It will be reviewed and verified by admin." : "Record an offline sale. Reviewed within 3–7 working days."}
          </Text>

          {/* Product picker */}
          <View>
            <Text style={labelStyle}>Product *</Text>
            <TouchableOpacity style={[inputStyle, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]} onPress={() => setShowProductPicker(!showProductPicker)}>
              <Text style={{ color: selectedProduct ? "#fafafa" : "#71717a", fontSize: 14, flex: 1 }} numberOfLines={1}>
                {selectedProduct ? selectedProduct.name : "Select a product"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#71717a" />
            </TouchableOpacity>
            {showProductPicker && (
              <View style={{ backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", borderRadius: 10, marginTop: 4 }}>
                {products.map((p) => (
                  <TouchableOpacity key={p.id} style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#27272a" }}
                    onPress={() => { setSelectedProductId(p.id); setShowProductPicker(false); }}>
                    <Text style={{ color: "#fafafa", fontSize: 14 }}>{p.name}</Text>
                    <Text style={{ color: "#71717a", fontSize: 11 }}>{p.product_type} · {p.commission_type === "percentage" ? `${p.commission_rate}% comm.` : `₦${p.commission_value} comm.`}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {!isLead && (
            <>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={labelStyle}>Quantity</Text>
                  <TextInput style={inputStyle} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={labelStyle}>Customer Name *</Text>
                  <TextInput style={inputStyle} placeholder="e.g. Bola A." placeholderTextColor="#71717a" value={customer} onChangeText={setCustomer} />
                </View>
              </View>

              <View>
                <Text style={labelStyle}>Proof of Sale *</Text>
                <TouchableOpacity onPress={pickProof} style={{ backgroundColor: "#27272a", borderRadius: 10, padding: 14, alignItems: "center", borderWidth: 1, borderStyle: "dashed", borderColor: proofUri ? "#3b82f6" : "#52525b" }}>
                  {proofUri ? (
                    <View style={{ alignItems: "center", gap: 8 }}>
                      <Image source={{ uri: proofUri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                      <Text style={{ color: "#3b82f6", fontSize: 12 }}>Tap to change</Text>
                    </View>
                  ) : (
                    <View style={{ alignItems: "center", gap: 6 }}>
                      <Ionicons name="cloud-upload-outline" size={24} color="#71717a" />
                      <Text style={{ color: "#71717a", fontSize: 13 }}>Upload receipt / screenshot</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          <View>
            <Text style={labelStyle}>Notes (optional)</Text>
            <TextInput style={[inputStyle, { height: 80, textAlignVertical: "top" }]} placeholder="Any additional details..." placeholderTextColor="#71717a" value={notes} onChangeText={setNotes} multiline />
          </View>

          {selectedProduct && (
            <View style={{ backgroundColor: "#18181b", borderWidth: 1, borderColor: "#3b82f6", borderRadius: 10, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#71717a", fontSize: 12 }}>Estimated Commission</Text>
              <Text style={{ color: "#3b82f6", fontWeight: "700", fontSize: 18 }}>₦{calcCommission().toLocaleString()}</Text>
            </View>
          )}

          <TouchableOpacity onPress={handleSubmit} disabled={submitting} style={{ borderRadius: 12, height: 52, alignItems: "center", justifyContent: "center", overflow: "hidden", marginTop: 4, marginBottom: 20 }}>
            <View style={{ position: "absolute", inset: 0, backgroundColor: "#2563eb", borderRadius: 12 }} />
            <View style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", backgroundColor: "#7c3aed", borderRadius: 12, opacity: 0.6 }} />
            {submitting ? <ActivityIndicator color="#fff" style={{ zIndex: 1 }} /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15, zIndex: 1 }}>{isLead ? "Submit Lead" : "Submit Sale"}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Request Payout Modal ────────────────────────────────────────────────────
function RequestPayoutModal({ visible, onClose, availableBalance, profile, onSuccess }: { visible: boolean; onClose: () => void; availableBalance: number; profile: any; onSuccess: () => void }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const parsedAmount = parseFloat(amount) || 0;
  const hasBankDetails = profile?.bank_name && profile?.account_number;
  const hasKyc = !!(profile?.nin && profile?.bvn);

  const amountError =
    parsedAmount <= 0 ? null
      : parsedAmount < MIN_PAYOUT ? `Minimum payout is ₦${MIN_PAYOUT.toLocaleString()}`
        : parsedAmount > availableBalance ? "Amount exceeds available balance"
          : null;

  const canSubmit = parsedAmount >= MIN_PAYOUT && parsedAmount <= availableBalance && !amountError && hasBankDetails && hasKyc && pin.length >= 4 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-payout", { body: { amount: parsedAmount, pin } });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      Alert.alert("Requested", data?.message || "Payout requested! Payment confirmation takes 3–7 working days.");
      setAmount(""); setPin("");
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to request payout");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = { backgroundColor: "#27272a", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: "#fafafa", fontSize: 14 };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#09090b" }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#27272a" }}>
          <Text style={{ color: "#fafafa", fontSize: 18, fontWeight: "700" }}>Request Payout</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#71717a" /></TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
          {/* Available balance */}
          <View style={{ backgroundColor: "#18181b", borderRadius: 12, padding: 16, alignItems: "center" }}>
            <Text style={{ color: "#71717a", fontSize: 12 }}>Available Balance</Text>
            <Text style={{ color: "#fafafa", fontSize: 28, fontWeight: "800", marginTop: 4 }}>₦{availableBalance.toLocaleString()}</Text>
          </View>

          {/* Checks */}
          {!hasBankDetails && (
            <View style={{ backgroundColor: "rgba(245,158,11,0.1)", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)", borderRadius: 10, padding: 12, flexDirection: "row", gap: 10 }}>
              <Ionicons name="alert-circle-outline" size={16} color="#f59e0b" />
              <Text style={{ color: "#f59e0b", fontSize: 12, flex: 1 }}>No bank details on file. Go to Settings → Profile → Payout Details to add them.</Text>
            </View>
          )}
          {!hasKyc && (
            <View style={{ backgroundColor: "rgba(245,158,11,0.1)", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)", borderRadius: 10, padding: 12, flexDirection: "row", gap: 10 }}>
              <Ionicons name="shield-outline" size={16} color="#f59e0b" />
              <Text style={{ color: "#f59e0b", fontSize: 12, flex: 1 }}>KYC not complete. Go to Settings → KYC Verification to submit your details.</Text>
            </View>
          )}
          {hasBankDetails && (
            <View style={{ backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", borderRadius: 10, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons name="card-outline" size={18} color="#3b82f6" />
              <View>
                <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "600" }}>{profile.bank_name}</Text>
                <Text style={{ color: "#71717a", fontSize: 12 }}>****{profile.account_number?.slice(-4)}</Text>
              </View>
            </View>
          )}

          {/* Amount */}
          <View>
            <Text style={{ color: "#a1a1aa", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Amount (₦)</Text>
            <TextInput style={inputStyle} placeholder={`Min ₦${MIN_PAYOUT.toLocaleString()}`} placeholderTextColor="#71717a" value={amount} onChangeText={setAmount} keyboardType="numeric" />
            {amountError && <Text style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{amountError}</Text>}
          </View>

          {/* PIN */}
          <View>
            <Text style={{ color: "#a1a1aa", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Transaction PIN</Text>
            <TextInput
              style={[inputStyle, { letterSpacing: 12, textAlign: "center", fontSize: 20 }]}
              placeholder="••••"
              placeholderTextColor="#71717a"
              value={pin}
              onChangeText={setPin}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          <Text style={{ color: "#71717a", fontSize: 11, textAlign: "center" }}>
            Only verified sales are eligible. Verification takes 3–7 working days.
          </Text>

          <TouchableOpacity onPress={handleSubmit} disabled={!canSubmit} style={{ borderRadius: 12, height: 52, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 20 }}>
            <View style={{ position: "absolute", inset: 0, backgroundColor: canSubmit ? "#2563eb" : "#27272a", borderRadius: 12 }} />
            {canSubmit && <View style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", backgroundColor: "#7c3aed", borderRadius: 12, opacity: 0.6 }} />}
            {submitting ? <ActivityIndicator color="#fff" style={{ zIndex: 1 }} /> : <Text style={{ color: canSubmit ? "#fff" : "#71717a", fontWeight: "700", fontSize: 15, zIndex: 1 }}>Request Payout</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function WalletScreen() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ balance: 0, pendingEarnings: 0, totalEarned: 0, totalPaid: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TxTab>("All");
  const [refreshing, setRefreshing] = useState(false);
  const [logSaleOpen, setLogSaleOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [{ data: txns }, { data: prof }] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);

    const all = txns || [];
    setTransactions(all);
    setProfile(prof);

    const earned = all.filter((t) => t.type !== "payout").reduce((s: number, t: any) => s + (t.amount || 0), 0);
    const paid = all.filter((t) => t.type === "payout").reduce((s: number, t: any) => s + (t.amount || 0), 0);
    const pending = all.filter((t) => t.type === "commission" && t.status === "pending").reduce((s: number, t: any) => s + (t.amount || 0), 0);
    setSummary({ balance: earned - paid, pendingEarnings: pending, totalEarned: earned, totalPaid: paid });
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const filtered = activeTab === "All" ? transactions : transactions.filter((t) => TX_TYPE_MAP[activeTab].includes(t.type));

  return (
    <View style={{ flex: 1, backgroundColor: "#09090b" }}>
      <AppHeader />
      <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: "#fafafa", fontSize: 22, fontWeight: "700" }}>Wallet & Earnings</Text>
            <Text style={{ color: "#71717a", fontSize: 13, marginTop: 2 }}>Track your earnings and payouts</Text>
          </View>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#3b82f6", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}
            onPress={() => setLogSaleOpen(true)}
          >
            <Ionicons name="add-circle-outline" size={16} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>Log a Sale</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          {/* Available Balance */}
          <View style={{ backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Ionicons name="wallet-outline" size={15} color="#3b82f6" />
              <Text style={{ color: "#71717a", fontSize: 12 }}>Available Balance</Text>
            </View>
            <Text style={{ color: "#fafafa", fontSize: 32, fontWeight: "700" }}>₦{summary.balance.toLocaleString()}</Text>
            <TouchableOpacity
              style={{ backgroundColor: "#3b82f6", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 12 }}
              onPress={() => setPayoutOpen(true)}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Request Payout</Text>
            </TouchableOpacity>
          </View>

          {/* Pending Earnings */}
          <View style={{ backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Ionicons name="time-outline" size={15} color="#f59e0b" />
              <Text style={{ color: "#71717a", fontSize: 12 }}>Pending Earnings</Text>
            </View>
            <Text style={{ color: "#fafafa", fontSize: 24, fontWeight: "700" }}>₦{summary.pendingEarnings.toLocaleString()}</Text>
            <Text style={{ color: "#71717a", fontSize: 11, marginTop: 4 }}>Confirmed in 3–7 working days</Text>
          </View>

          {/* Total Earned */}
          <View style={{ backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Ionicons name="cash-outline" size={15} color="#4ade80" />
              <Text style={{ color: "#71717a", fontSize: 12 }}>Total Earned (Lifetime)</Text>
            </View>
            <Text style={{ color: "#fafafa", fontSize: 24, fontWeight: "700" }}>₦{summary.totalEarned.toLocaleString()}</Text>
            <Text style={{ color: "#71717a", fontSize: 11, marginTop: 4 }}>₦{summary.totalPaid.toLocaleString()} paid out</Text>
          </View>

          {/* Tabs */}
          <View style={{ backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", borderRadius: 12, overflow: "hidden" }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderBottomWidth: 1, borderBottomColor: "#27272a" }}>
              {TX_TABS.map((tab) => (
                <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: activeTab === tab ? "#3b82f6" : "transparent" }}>
                  <Text style={{ color: activeTab === tab ? "#3b82f6" : "#71717a", fontSize: 13, fontWeight: "600" }}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filtered.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Ionicons name="receipt-outline" size={36} color="#71717a" />
                <Text style={{ color: "#71717a", fontSize: 13, marginTop: 8 }}>No transactions</Text>
              </View>
            ) : (
              filtered.map((tx, idx) => {
                const meta = TX_ICONS[tx.type] || { icon: "flash-outline", color: "#f59e0b" };
                const isPayout = tx.type === "payout";
                return (
                  <View key={tx.id} style={{ flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: idx < filtered.length - 1 ? 1 : 0, borderBottomColor: "#27272a" }}>
                    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: meta.color + "22", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                      <Ionicons name={meta.icon as any} size={18} color={meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#fafafa", fontSize: 13, fontWeight: "500" }}>{tx.description || tx.type}</Text>
                      <Text style={{ color: "#71717a", fontSize: 11, marginTop: 1 }}>
                        {new Date(tx.created_at).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ color: isPayout ? "#ef4444" : "#4ade80", fontWeight: "700", fontSize: 14 }}>
                        {isPayout ? "-" : "+"}₦{(tx.amount || 0).toLocaleString()}
                      </Text>
                      {tx.status && (
                        <View style={{ backgroundColor: tx.status === "paid" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3 }}>
                          <Text style={{ color: tx.status === "paid" ? "#4ade80" : "#f59e0b", fontSize: 10, fontWeight: "600" }}>{tx.status}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>

      <LogSaleModal visible={logSaleOpen} onClose={() => setLogSaleOpen(false)} onSuccess={fetchData} />
      <RequestPayoutModal visible={payoutOpen} onClose={() => setPayoutOpen(false)} availableBalance={summary.balance} profile={profile} onSuccess={fetchData} />
    </View>
  );
}
