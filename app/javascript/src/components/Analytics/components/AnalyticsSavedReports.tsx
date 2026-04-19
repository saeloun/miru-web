import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Trash, FloppyDisk } from "phosphor-react";
import { useNavigate } from "react-router-dom";

import { analyticsApi } from "apis/api";
import { useUserContext } from "../../../context/UserContext";
import { SavedAnalyticsReport } from "../types";
import { analyticsReportLabelMap, analyticsReportPathMap, buildSavedReportSearch } from "../savedReports";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";

type AnalyticsSavedReportsProps = {
  reportType: SavedAnalyticsReport["report_type"];
  filters: Record<string, any>;
  allowSave: boolean;
};

const AnalyticsSavedReports: React.FC<AnalyticsSavedReportsProps> = ({
  reportType,
  filters,
  allowSave,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");

  const reportsQuery = useQuery({
    queryKey: ["analytics", "saved-reports"],
    queryFn: async () => {
      const response = await analyticsApi.getSavedReports();
      return response.data.reports as SavedAnalyticsReport[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      analyticsApi.createSavedReport({
        analytics_report: {
          name,
          report_type: reportType,
          filters,
        },
      }),
    onSuccess: () => {
      setOpen(false);
      setName("");
      queryClient.invalidateQueries({ queryKey: ["analytics", "saved-reports"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => analyticsApi.deleteSavedReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics", "saved-reports"] });
    },
  });

  const reports = reportsQuery.data || [];

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Saved reports</CardTitle>
          <CardDescription>
            Reopen analytics configurations saved in this workspace.
          </CardDescription>
        </div>
        {allowSave ? (
          <Button onClick={() => setOpen(true)}>
            <FloppyDisk className="mr-2 h-4 w-4" />
            Save Report
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {reportsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading saved reports...</p>
        ) : reportsQuery.isError ? (
          <p className="text-sm text-destructive">Unable to load saved reports.</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No saved analytics reports yet.
          </p>
        ) : (
          reports.map(report => (
            <div
              key={report.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="font-medium text-foreground">{report.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {analyticsReportLabelMap[report.report_type]} · {report.creator_name} · {format(new Date(report.created_at), "MMM dd, yyyy")}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    const response = await analyticsApi.getSavedReport(report.id);
                    const savedReport = response.data.report as SavedAnalyticsReport;

                    navigate(
                      `${analyticsReportPathMap[savedReport.report_type]}${buildSavedReportSearch(savedReport.filters)}`
                    );
                  }}
                >
                  Open
                </Button>
                {report.can_delete || Number(report.created_by_id) === Number(user.id) ? (
                  <Button
                    variant="ghost"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(report.id)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save analytics report</DialogTitle>
            <DialogDescription>
              Save the current analytics filters and report view for later.
            </DialogDescription>
          </DialogHeader>

          <Input
            placeholder="Enter report name"
            value={name}
            onChange={event => setName(event.target.value)}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={createMutation.isPending || name.trim() === ""}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AnalyticsSavedReports;
