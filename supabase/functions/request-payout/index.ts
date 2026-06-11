import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { verifyPin } from "../_shared/pin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { amount, pin, mfaCode } = await req.json();

    if (!amount || amount < 5000) {
      return new Response(JSON.stringify({ error: "Invalid amount or below minimum (₦5,000)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pin) {
      return new Response(JSON.stringify({ error: "Transaction PIN is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch User Profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("transaction_pin, security_locked_until, bank_name, account_number, account_type, name, email, bank_account_verified")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Could not fetch user profile");
    }

    if (!profile.bank_account_verified) {
      return new Response(
        JSON.stringify({ error: "Your bank account has not been verified yet. Please contact support or complete KYC." }), 
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1.5 Check if Bank Account is shared with another user (Anti-Fraud)
    const { data: duplicateAccountUser, error: dupError } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("account_number", profile.account_number)
      .neq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const isSharedAccount = !!duplicateAccountUser;

    // 2. Check 24-hr Cool-Off Period
    if (profile.security_locked_until) {
      const lockedUntil = new Date(profile.security_locked_until);
      if (lockedUntil > new Date()) {
        return new Response(
          JSON.stringify({ 
            error: "Security Lock Active. To protect your funds after recent changes, withdrawals are frozen until " + lockedUntil.toLocaleString() 
          }), 
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 3. Verify Transaction PIN (salted PBKDF2; legacy SHA-256 still accepted, plaintext never)
    const pinValid = await verifyPin(String(pin), profile.transaction_pin);
    if (!pinValid) {
      return new Response(
        JSON.stringify({ error: "Invalid Transaction PIN" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // 3.5 Verify MFA if enabled
    const { data: factors, error: factorsError } = await supabaseClient.auth.mfa.listFactors();
    if (factorsError) throw factorsError;
    
    const totpFactor = factors.all.find(f => f.factor_type === 'totp' && f.status === 'verified');
    if (totpFactor) {
      if (!mfaCode) {
        return new Response(JSON.stringify({ error: "2FA Authenticator code required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: challenge, error: challengeError } = await supabaseClient.auth.mfa.challenge({ factorId: totpFactor.id });
      if (challengeError) throw challengeError;

      const { data: verify, error: verifyError } = await supabaseClient.auth.mfa.verify({
        challengeId: challenge.id,
        code: mfaCode,
      });

      if (verifyError || !verify) {
        return new Response(JSON.stringify({ error: "Invalid 2FA Authenticator code" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    // We also require Bank Details
    if (!profile.bank_name || !profile.account_number) {
       return new Response(
        JSON.stringify({ error: "Bank details not configured." }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );     
    }

    // 4. Calculate Balance based on verified and withdrawable transactions
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('amount, type, status, withdrawable_at')
      .eq('user_id', user.id);
      
    if (txError) throw txError;

    const now = new Date();
    let availableBalance = 0;
    for (const t of transactions) {
      if (t.type === 'payout') {
        availableBalance -= Math.abs(t.amount);
      } else if (t.status === 'paid' || t.status === 'verified') {
        const withdrawableAt = new Date(t.withdrawable_at || Date.now());
        if (withdrawableAt <= now) {
          availableBalance += t.amount;
        }
      }
    }

    if (amount > availableBalance) {
      return new Response(
        JSON.stringify({ error: `Insufficient funds. Your withdrawable balance is NGN${availableBalance.toLocaleString()}` }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Apply Threshold / Velocity Rules
    // E.g. anything over 50,000 OR shared bank accounts needs manual review
    const isLargeAmount = amount >= 50000;
    const needsManualReview = isLargeAmount || isSharedAccount;
    const initialStatus = needsManualReview ? "pending_review" : "pending";

    // 6. Execute Withdrawal (Insert Payout & Negative Transaction) 
    // This MUST be done with service_role because we blocked authenticated users via RLS
    const payoutId = crypto.randomUUID();

    const { error: insertError } = await supabaseAdmin
      .from("payouts")
      .insert({
        id: payoutId,
        user_id: user.id,
        amount: amount,
        bank_name: profile.bank_name,
        account_number: profile.account_number,
        account_name: profile.name,
        account_type: profile.account_type,
        status: initialStatus,
        metadata: {
           is_shared_bank: isSharedAccount,
           is_large_amount: isLargeAmount
        }
      });

    if (insertError) throw insertError;

    const { error: txInsertError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: user.id,
        amount: -Math.abs(amount), // Negative to debit the ledger
        type: "payout",
        status: needsManualReview ? "pending" : "processing",
        description: `Withdrawal request to ${profile.bank_name} - ${profile.account_number}`,
      });

    if (txInsertError) {
      // Rollback is usually best done in a SQL function, but we'll soft-handle it here 
      // by deleting the payout if the tx fails.
      await supabaseAdmin.from("payouts").delete().eq("id", payoutId);
      throw txInsertError;
    }

    let successMessage = "Payout request submitted successfully.";
    if (isLargeAmount && isSharedAccount) {
      successMessage = "Payout request submitted. Due to the large amount and shared bank account detected, it has been flagged for manual administrative review.";
    } else if (isLargeAmount) {
      successMessage = "Payout request submitted. Due to the large amount, it has been flagged for manual review.";
    } else if (isSharedAccount) {
      successMessage = "Payout request submitted. Note: This bank account has been flagged for review as it is also used by another seller account.";
    }

    // Send email using Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (RESEND_API_KEY && profile?.email) {
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Payout Request Received 💸</h2>
          <p>Hello ${profile.name || 'Volt User'},</p>
          <p>We've received your payout request for <strong>₦${amount.toLocaleString()}</strong>.</p>
          <p>It will be processed and transferred to your bank account (<strong>${profile.bank_name} - ${profile.account_number}</strong>) shortly.</p>
          <p><em>${successMessage}</em></p>
          <br/>
          <p>Best regards,<br/>Volt Team ⚡</p>
        </div>
      `;

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Volt <hello@tryvoltapp.com>",
            to: [profile.email],
            subject: "Volt Payout Request Received 💸",
            html: emailHtml,
          }),
        });
        if (!res.ok) {
          console.error("Resend API error:", await res.text());
        }
      } catch (emailErr) {
        console.error("Error sending payout email:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: successMessage,
        availableBalance: availableBalance - amount
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in request-payout function:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
