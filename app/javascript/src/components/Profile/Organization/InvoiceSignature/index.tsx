import React, { useCallback, useEffect, useRef, useState } from "react";

import { invoiceSignatureApi } from "apis/api";
import { useUserContext } from "context/UserContext";
import { PencilLine, Trash, Upload } from "phosphor-react";
import { Toastr } from "StyledComponents";

import { Alert, AlertDescription } from "../../../ui/alert";
import { Button } from "../../../ui/button";
import { Card, CardContent, CardHeader } from "../../../ui/card";
import { Label } from "../../../ui/label";
import { Skeleton } from "../../../ui/skeleton";

const InvoiceSignature: React.FC = () => {
  const { company } = useUserContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const companyId = (company as any)?.id;

  const fetchSignature = useCallback(async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      const res = await invoiceSignatureApi.show(companyId);
      if (res.data.attached) {
        setSignatureUrl(res.data.signature_url);
        setFilename(res.data.filename);
      } else {
        setSignatureUrl(null);
        setFilename(null);
      }
    } catch {
      // Silently handle - no signature is fine
      setSignatureUrl(null);
      setFilename(null);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchSignature();
  }, [fetchSignature]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("invoice_signature", file);

    try {
      const res = await invoiceSignatureApi.create(companyId, formData);
      setSignatureUrl(res.data.signature_url);
      setFilename(file.name);
      Toastr.success("Invoice signature uploaded successfully");
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error || "Failed to upload signature";
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!companyId || isDeleting) return;

    setError(null);
    setIsDeleting(true);

    try {
      await invoiceSignatureApi.destroy(companyId);
      setSignatureUrl(null);
      setFilename(null);
      Toastr.success("Invoice signature removed");
    } catch {
      setError("Failed to remove signature");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="overflow-hidden border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            <PencilLine className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Invoice Signature
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Label className="text-xs font-medium text-muted-foreground">
            Upload a PNG signature image (max 300×150px, 500KB) to include on
            client invoices.
          </Label>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <Skeleton className="h-24 w-full rounded-lg" />
          ) : signatureUrl ? (
            <div className="relative group">
              <div className="flex items-center justify-center rounded-lg border border-border bg-card p-4">
                <img
                  alt="Invoice signature"
                  className="max-h-20 object-contain"
                  src={signatureUrl}
                />
              </div>
              {filename && (
                <p className="mt-1 text-xs text-muted-foreground">{filename}</p>
              )}
              <div className="mt-3 flex gap-2">
                <Button
                  disabled={isUploading || isDeleting}
                  onClick={handleUploadClick}
                  size="sm"
                  variant="outline"
                >
                  <Upload className="mr-1 h-3 w-3" />
                  Replace
                </Button>
                <Button
                  disabled={isUploading || isDeleting}
                  onClick={handleDelete}
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash className="mr-1 h-3 w-3" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-all hover:border-primary/40 hover:bg-accent/60"
              onClick={handleUploadClick}
            >
              <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {isUploading ? "Uploading..." : "Click to upload signature"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PNG only, max 300×150px
              </p>
            </div>
          )}

          <input
            accept="image/png"
            className="hidden"
            onChange={handleFileSelect}
            ref={fileInputRef}
            type="file"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceSignature;
