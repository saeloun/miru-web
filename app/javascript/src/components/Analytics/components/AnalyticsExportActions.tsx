import React from "react";

import { Button } from "../../ui/button";

type AnalyticsExportActionsProps = {
  onExport: (format: "csv" | "pdf") => void;
  isExporting: boolean;
};

const AnalyticsExportActions: React.FC<AnalyticsExportActionsProps> = ({
  onExport,
  isExporting,
}) => (
  <div className="flex flex-wrap gap-2">
    <Button
      variant="outline"
      disabled={isExporting}
      onClick={() => onExport("csv")}
    >
      {isExporting ? "Preparing..." : "Export CSV"}
    </Button>
    <Button
      variant="outline"
      disabled={isExporting}
      onClick={() => onExport("pdf")}
    >
      {isExporting ? "Preparing..." : "Export PDF"}
    </Button>
  </div>
);

export default AnalyticsExportActions;
