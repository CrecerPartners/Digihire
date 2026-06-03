import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { S3Client, PutObjectCommand, GetObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.540.0";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.540.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Define public and private buckets mapping
const PUBLIC_BUCKETS = ["avatars", "shop-logos", "product-images", "brand-assets", "talent-assets"];
const PRIVATE_BUCKETS = ["kyc-documents", "verification-docs", "sale-proofs"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse request body
    const { bucket, key, action, contentType } = await req.json();

    if (!bucket || !key || !action) {
      return new Response(
        JSON.stringify({ error: "bucket, key, and action are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (![...PUBLIC_BUCKETS, ...PRIVATE_BUCKETS].includes(bucket)) {
      return new Response(
        JSON.stringify({ error: `Invalid bucket: ${bucket}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. User Authorization Checks
    const meta = user.user_metadata ?? {};
    const roles: string[] = Array.isArray(meta.account_types)
      ? meta.account_types
      : meta.account_type ? [meta.account_type] : [];
    const isAdmin = roles.includes("admin");

    // Rules for non-admin users
    if (!isAdmin) {
      // For private files, ensure they can only upload/download their own documents (matching prefix)
      if (PRIVATE_BUCKETS.includes(bucket)) {
        if (!key.startsWith(user.id)) {
          return new Response(
            JSON.stringify({ error: "Forbidden: You can only access your own private files" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // For public files that are user-specific, restrict writes (PUT) to their own prefix
      if (action === "upload") {
        if (["avatars", "shop-logos"].includes(bucket) && !key.startsWith(user.id)) {
          return new Response(
            JSON.stringify({ error: "Forbidden: You can only upload files in your own folder" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // Protect product-images upload from non-admins
        if (bucket === "product-images") {
          return new Response(
            JSON.stringify({ error: "Forbidden: Only admins can upload product images" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // 4. Initialize S3 client for Cloudflare R2
    const r2Endpoint = Deno.env.get("R2_ENDPOINT");
    const r2AccessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const r2SecretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const r2PublicBucket = Deno.env.get("R2_PUBLIC_BUCKET") || "digihire-public";
    const r2PrivateBucket = Deno.env.get("R2_PRIVATE_BUCKET") || "digihire-private";
    const r2PublicUrlPrefix = Deno.env.get("R2_PUBLIC_URL_PREFIX");

    if (!r2Endpoint || !r2AccessKeyId || !r2SecretAccessKey) {
      console.error("Missing R2 environment variables");
      return new Response(
        JSON.stringify({ error: "R2 storage service is not properly configured on server" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const s3Client = new S3Client({
      region: "auto",
      endpoint: r2Endpoint,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
    });

    const isPublicBucket = PUBLIC_BUCKETS.includes(bucket);
    const targetR2Bucket = isPublicBucket ? r2PublicBucket : r2PrivateBucket;
    
    // We prefix the key with the bucket name to organize files by category within the single R2 bucket
    const r2Key = `${bucket}/${key}`;

    let signedUrl = "";
    if (action === "upload") {
      const command = new PutObjectCommand({
        Bucket: targetR2Bucket,
        Key: r2Key,
        ContentType: contentType || "application/octet-stream",
      });
      // URL expires in 1 hour
      signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } else if (action === "download") {
      const command = new GetObjectCommand({
        Bucket: targetR2Bucket,
        Key: r2Key,
      });
      // URL expires in 1 hour
      signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } else {
      return new Response(
        JSON.stringify({ error: `Invalid action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const responsePayload: Record<string, string> = { url: signedUrl };

    // If it's a public bucket, construct and return the public CDN access URL
    if (isPublicBucket && r2PublicUrlPrefix) {
      responsePayload.publicUrl = `${r2PublicUrlPrefix}/${r2Key}`;
    }

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in r2-storage function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
