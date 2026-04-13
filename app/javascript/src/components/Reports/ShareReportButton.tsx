import React, { useState } from "react";
import { LinkSimple } from "@phosphor-icons/react";
import { i18n } from "../../i18n";
import { Button } from "../ui/button";
import { copyText } from "./filterUtils";

const ShareReportButton: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const didCopy = await copyText(window.location.href);

    if (!didCopy) return;

    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" onClick={handleCopy}>
      <LinkSimple className="mr-2 h-4 w-4" />
      {copied ? i18n.t("reports.linkCopied") : i18n.t("reports.shareReport")}
    </Button>
  );
};

export default ShareReportButton;
