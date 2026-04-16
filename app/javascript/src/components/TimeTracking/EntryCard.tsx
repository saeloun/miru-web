import React from "react";
import dayjs from "dayjs";
import { minToHHMM } from "helpers";
import { Trash, PencilSimple, Clock, Briefcase, Play } from "phosphor-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { useUserContext } from "context/UserContext";
import { Roles } from "../../constants";
import { i18n } from "../../i18n";

interface props {
  id: number;
  client: string;
  project: string;
  projectId: number;
  work_date?: string;
  note: string;
  duration: number;
  source_label?: string;
  source_metadata?: Record<string, string>;
  handleDeleteEntry: (id: number) => void;
  setEditEntryId: React.Dispatch<React.SetStateAction<number>>;
  bill_status: string;
  setNewEntryView: any;
  handleDuplicate: any;
  handleResumeTimer: (entry: {
    client: string;
    project: string;
    projectId: number;
    note: string;
  }) => void;
}

const isPrivilegedRole = role =>
  role === Roles["OWNER"] || role === Roles["ADMIN"];

const isAdminRole = role => role === Roles["ADMIN"];

const isOlderThanOneWeek = workDate => {
  const parsedDate = dayjs(workDate);
  if (!workDate || !parsedDate.isValid()) return false;

  return dayjs().startOf("day").diff(parsedDate.startOf("day"), "day") > 7;
};

const canEditTimeEntry = (billStatus, role, workDate) => {
  if (isOlderThanOneWeek(workDate)) return isAdminRole(role);

  if (isPrivilegedRole(role)) return true;

  return billStatus !== "billed";
};

const EntryCard: React.FC<props> = ({
  id,
  client,
  project,
  projectId,
  work_date,
  note,
  duration,
  source_label,
  source_metadata,
  handleDeleteEntry,
  setEditEntryId,
  bill_status,
  setNewEntryView,
  handleDuplicate,
  handleResumeTimer,
}) => {
  const { isDesktop, companyRole } = useUserContext();
  const canManageEntry = canEditTimeEntry(bill_status, companyRole, work_date);
  const sourceSkill = source_metadata?.skill;
  const sourceServer = source_metadata?.mcp_server;

  const handleCardClick = () => {
    if (!isDesktop && canManageEntry) {
      setEditEntryId(id);
      setNewEntryView(true);
    }
  };

  return (
    <Card
      className={cn(
        "group relative mb-4 overflow-hidden transition-all duration-200 hover:shadow-lg",
        "border-border bg-card hover:border-primary/60",
        !isDesktop && canManageEntry && "cursor-pointer active:scale-[0.99]",
        "before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary before:opacity-0 before:transition-opacity hover:before:opacity-100"
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-4 lg:flex-[2]">
            {/* Header Row with Client, Project, and Mobile Duration */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shadow-sm">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 break-words text-base font-bold text-foreground">
                        {client}
                      </span>
                      <span className="shrink-0 text-border">|</span>
                      <span className="min-w-0 break-words text-base font-medium text-muted-foreground">
                        {project}
                      </span>
                    </div>
                    {(source_label || sourceSkill || sourceServer) && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {source_label && (
                          <Badge variant="secondary">{source_label}</Badge>
                        )}
                        {sourceSkill && (
                          <Badge variant="outline">{sourceSkill}</Badge>
                        )}
                        {sourceServer && (
                          <Badge variant="outline">{sourceServer}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:hidden">
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground tabular-nums">
                    {minToHHMM(duration)}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {i18n.t("hours")}
                  </div>
                </div>
              </div>
            </div>

            {/* Note Section with Better Typography */}
            {note && (
              <div className="relative">
                <div className="absolute bottom-0 left-0 top-0 w-1 rounded-full bg-gradient-to-b from-primary/40 to-transparent"></div>
                <div className="pl-6">
                  <p
                    data-testid="time-entry-note"
                    className="max-w-4xl overflow-hidden whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-base leading-relaxed text-muted-foreground"
                  >
                    {note.split("\n").map((line, index) => {
                      if (line.trim().startsWith("•")) {
                        return (
                          <span key={index} className="block mb-2 pl-4">
                            <span className="mr-3 -ml-4 text-primary">▸</span>
                            <span className="text-sm text-muted-foreground">
                              {line.replace("•", "").trim()}
                            </span>
                          </span>
                        );
                      }

                      if (index === 0) {
                        return (
                          <span
                            key={index}
                            className="mb-3 block break-words [overflow-wrap:anywhere] text-lg font-bold text-foreground"
                          >
                            {line}
                          </span>
                        );
                      }

                      return (
                        <span
                          key={index}
                          className="mb-1.5 block break-words [overflow-wrap:anywhere] leading-relaxed text-muted-foreground"
                        >
                          {line}
                        </span>
                      );
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            <div className="rounded-2xl border border-border bg-muted/40 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card shadow-md">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {i18n.t("timeTracking.timeLogged")}
                  </div>
                  <div className="text-3xl font-bold text-foreground tabular-nums">
                    {minToHHMM(duration)}
                  </div>
                </div>
              </div>
            </div>

            {canManageEntry && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  data-testid="resume-timer-entry"
                  onClick={e => {
                    e.stopPropagation();
                    handleResumeTimer({ client, project, projectId, note });
                  }}
                  title={i18n.t("timeTracking.resumeTimer")}
                >
                  <Play className="mr-1 h-4 w-4" />
                  {i18n.t("timeTracking.resume")}
                </Button>
                <div className="flex items-center gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 hover:bg-accent hover:text-primary"
                    onClick={e => {
                      e.stopPropagation();
                      setEditEntryId(id);
                      setNewEntryView(true);
                    }}
                    title={i18n.t("timeTracking.editEntry")}
                  >
                    <PencilSimple className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteEntry(id);
                    }}
                    title={i18n.t("timeTracking.deleteEntry")}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EntryCard;
