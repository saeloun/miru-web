import React from "react";

import {
  FileArrowDown,
  FilePdf,
  FileText,
  ArrowSquareOut,
} from "phosphor-react";

import { Button } from "../ui/button";

const imagePattern = /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i;
const pdfPattern = /\.pdf(\?.*)?$/i;

const fileNameFromUrl = (url: string) =>
  decodeURIComponent(url.split("/").pop()?.split("?")[0] || "receipt");

const isImage = (url: string) => imagePattern.test(url);
const isPdf = (url: string) => pdfPattern.test(url);

interface ReceiptPreviewProps {
  receipts: string[];
}

const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ receipts }) => {
  if (receipts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
        No receipts attached.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {receipts.map(receipt => {
        const fileName = fileNameFromUrl(receipt);

        return (
          <div
            key={receipt}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {fileName}
                </p>
              </div>
              <div className="ml-3 flex items-center gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={receipt} target="_blank" rel="noreferrer">
                    <ArrowSquareOut size={16} className="mr-2" />
                    Open
                  </a>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <a href={receipt} download={fileName}>
                    <FileArrowDown size={16} className="mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            </div>

            <div className="bg-muted/30 p-4">
              {isImage(receipt) ? (
                <div className="overflow-hidden rounded-lg border border-border bg-background">
                  <img
                    src={receipt}
                    alt={fileName}
                    className="h-64 w-full object-contain"
                  />
                </div>
              ) : isPdf(receipt) ? (
                <div className="overflow-hidden rounded-lg border border-border bg-background">
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-sm text-muted-foreground">
                    <FilePdf size={18} className="text-foreground" />
                    PDF preview
                  </div>
                  <iframe
                    src={receipt}
                    title={fileName}
                    className="h-64 w-full bg-background"
                  />
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background px-6 text-center">
                  <FileText size={32} className="mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    {fileName}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Preview isn&apos;t available for this file type.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReceiptPreview;
