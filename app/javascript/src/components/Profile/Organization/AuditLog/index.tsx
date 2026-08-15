import React, { useEffect, useState } from "react";

import { auditLogsApi } from "apis/api";
import Loader from "common/Loader";
import PlanAccessGate from "components/PlanAccessGate";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import { Input } from "components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { i18n } from "../../../../i18n";

type AuditLogRecord = {
  id: number;
  auditable_type: string;
  auditable_id: number;
  auditable_label: string;
  action: string;
  audited_changes: Record<string, unknown>;
  user: { name: string; email: string } | null;
  created_at: string;
};

type Pagination = {
  page: number;
  pages: number;
  prev: number | null;
  next: number | null;
};

const RECORD_TYPES = [
  "Client",
  "Project",
  "Company",
  "Invitation",
  "Expense",
  "Invoice",
  "Payment",
  "TimesheetEntry",
  "User",
];

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "object") return JSON.stringify(value);

  return String(value);
};

const changeSummary = (changes: Record<string, unknown>) =>
  Object.entries(changes).map(([key, value]) => {
    const [before, after] = Array.isArray(value) ? value : [null, value];

    return (
      <div className="text-xs" key={key}>
        <span className="font-medium">{key.replaceAll("_", " ")}:</span>{" "}
        {formatValue(before)} → {formatValue(after)}
      </div>
    );
  });

const AuditLog = () => {
  const [records, setRecords] = useState<AuditLogRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [recordType, setRecordType] = useState("all");
  const [action, setAction] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);

      try {
        const response = await auditLogsApi.index({
          page,
          auditable_type: recordType === "all" ? undefined : recordType,
          action: action === "all" ? undefined : action,
          from: from || undefined,
          to: to || undefined,
        });
        setRecords(response.data.audit_logs);
        setPagination(response.data.pagy);
        setLoadError(false);
      } catch {
        setRecords([]);
        setPagination(null);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [page, recordType, action, from, to]);

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setPage(1);
    setter(value);
  };

  return (
    <PlanAccessGate feature="audit">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle>{i18n.t("auditLog.title")}</CardTitle>
            <CardDescription>{i18n.t("auditLog.description")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              value={recordType}
              onValueChange={value => updateFilter(setRecordType, value)}
            >
              <SelectTrigger aria-label={i18n.t("auditLog.filters.recordType")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {i18n.t("auditLog.filters.allRecordTypes")}
                </SelectItem>
                {RECORD_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/([a-z])([A-Z])/g, "$1 $2")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={action}
              onValueChange={value => updateFilter(setAction, value)}
            >
              <SelectTrigger aria-label={i18n.t("auditLog.filters.action")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {i18n.t("auditLog.filters.allActions")}
                </SelectItem>
                {["create", "update", "destroy"].map(value => (
                  <SelectItem key={value} value={value}>
                    {i18n.t(`auditLog.actions.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              aria-label={i18n.t("auditLog.filters.from")}
              type="date"
              value={from}
              onChange={event => updateFilter(setFrom, event.target.value)}
            />
            <Input
              aria-label={i18n.t("auditLog.filters.to")}
              type="date"
              value={to}
              onChange={event => updateFilter(setTo, event.target.value)}
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          {loading ? (
            <Loader className="h-64" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{i18n.t("auditLog.columns.date")}</TableHead>
                    <TableHead>{i18n.t("auditLog.columns.actor")}</TableHead>
                    <TableHead>{i18n.t("auditLog.columns.action")}</TableHead>
                    <TableHead>{i18n.t("auditLog.columns.record")}</TableHead>
                    <TableHead>{i18n.t("auditLog.columns.changes")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length ? (
                    records.map(record => (
                      <TableRow key={record.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(record.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            {record.user?.name || i18n.t("auditLog.system")}
                          </div>
                          {record.user?.email && (
                            <div className="text-xs text-muted-foreground">
                              {record.user.email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {i18n.t(`auditLog.actions.${record.action}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>{record.auditable_type}</div>
                          <div className="text-xs text-muted-foreground">
                            {record.auditable_label}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-64 space-y-1">
                          {changeSummary(record.audited_changes)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell className="h-32 text-center" colSpan={5}>
                        {loadError
                          ? i18n.t("auditLog.loadError")
                          : i18n.t("auditLog.empty")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t p-4">
              <Button
                disabled={!pagination.prev}
                variant="outline"
                onClick={() => setPage(pagination.prev || 1)}
              >
                {i18n.t("auditLog.pagination.previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {i18n.t("auditLog.pagination.page", {
                  page: pagination.page,
                  pages: pagination.pages,
                })}
              </span>
              <Button
                disabled={!pagination.next}
                variant="outline"
                onClick={() => setPage(pagination.next || pagination.page)}
              >
                {i18n.t("auditLog.pagination.next")}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </PlanAccessGate>
  );
};

export default AuditLog;
