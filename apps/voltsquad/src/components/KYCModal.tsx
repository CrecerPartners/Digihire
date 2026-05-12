import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { useAuth } from "@digihire/shared";
import { useProfile, useUpdateProfile } from "@digihire/shared";
import { supabase } from "@digihire/shared";
import { Loader2, Upload, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface KYCModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function KYCModal({ open, onOpenChange, onSuccess }: KYCModalProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const [nin, setNin] = useState(profile?.nin || "");
  const [bvn, setBvn] = useState(profile?.bvn || "");
  const [proofUrl, setProofUrl] = useState(profile?.proof_of_address_url || "");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
    
    setUploadingDoc(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/proof_of_address-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("kyc-documents").upload(path, file, { upsert: true });
      if (error) throw error;
      
      const { data: urlData } = supabase.storage.from("kyc-documents").getPublicUrl(path);
      setProofUrl(urlData.publicUrl);
      toast.success("Proof of Address uploaded successfully!");
    } catch (err) {
      toast.error((err as Error).message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSubmit = async () => {
    if (!nin || !bvn || !proofUrl) {
      toast.error("Please provide your NIN, BVN and Proof of Address");
      return;
    }
    if (!/^d{11}$/.test(nin.trim())) {
      toast.error("NIN must be exactly 11 digits");
      return;
    }
    if (!/^d{11}$/.test(bvn.trim())) {
      toast.error("BVN must be exactly 11 digits");
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile.mutateAsync({
        nin,
        bvn,
        proof_of_address_url: proofUrl,
      });
      toast.success("KYC Details Submitted successfully!");
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message || "Failed to submit KYC");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your KYC</DialogTitle>
          <DialogDescription>
            You need to upload your KYC details to verify your identity before making a withdrawal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">NIN (National Identity Number)</label>
            <Input 
              placeholder="Enter your 11-digit NIN" 
              value={nin} 
              onChange={(e) => setNin(e.target.value)}
              maxLength={11}
              inputMode="numeric"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">BVN (Bank Verification Number)</label>
            <Input 
              placeholder="Enter your 11-digit BVN" 
              value={bvn} 
              onChange={(e) => setBvn(e.target.value)}
              maxLength={11}
              inputMode="numeric"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium flex justify-between items-center">
              <span>Proof of Address</span>
              {proofUrl && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Uploaded</span>}
            </label>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingDoc} className="w-full h-20 border-dashed">
                {uploadingDoc ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin text-muted-foreground" /> Uploading...</>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Upload className="h-5 w-5" />
                    <span>{proofUrl ? "Upload Different Document" : "Click to Upload Utility Bill/Bank Statement"}</span>
                  </div>
                )}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Accepts images and PDF (max 5MB)</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="volt-gradient" onClick={handleSubmit} disabled={submitting || !nin || !bvn || !proofUrl || uploadingDoc}>
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Submit KYC"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


