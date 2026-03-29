import React from "react";
import { minToHHMM } from "helpers";
import { Trash, PencilSimple, Clock, Briefcase } from "phosphor-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { useUserContext } from "context/UserContext";
import { Roles } from "../../constants";

interface props {
  id: number;
  client: string;
  project: string;
  note: string;
  duration: number;
  source_label?: string;
  source_metadata?: Record<string, string>;
  handleDeleteEntry: (id: number) => void;
  setEditEntryId: React.Dispatch<React.SetStateAction<number>>;
  bill_status: string;
  setNewEntryView: any;
  handleDuplicate: any;
}

const canEditTimeEntry = (billStatus, role) =>
  billStatus != "billed" || role == Roles["OWNER"] || role == Roles["ADMIN"];

const EntryCard: React.FC<props> = ({
  id,
  client,
  project,
  note,
  duration,
  source_label,
  source_metadata,
  handleDeleteEntry,
  setEditEntryId,
  bill_status,
  setNewEntryView,
  handleDuplicate,
}) => {
  const { isDesktop, companyRole } = useUserContext();
  const sourceSkill = source_metadata?.skill;
  const sourceServer = source_metadata?.mcp_server;

  const handleCardClick = () => {
    if (!isDesktop) {
      setEditEntryId(id);
      setNewEntryView(true);
    }
  };

  return (
    <Card
      className={cn(
        "group relative mb-4 overflow-hidden transition-all duration-200 hover:shadow-lg",
        "border-border bg-card hover:border-primary/60",
        !isDesktop && "cursor-pointer active:scale-[0.99]",
        "before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary before:opacity-0 before:transition-opacity hover:before:opacity-100"
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1 lg:flex-[2] space-y-4">
            {/* Header Row with Client, Project, and Mobile Duration */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shadow-sm">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-foreground">
                        {client}
                      </span>
                      <span className="text-border">|</span>
                      <span className="text-base font-medium text-muted-foreground">
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
                    hours
                  </div>
                </div>
              </div>
            </div>

            {/* Note Section with Better Typography */}
            {note && (
              <div className="relative">
                <div className="absolute bottom-0 left-0 top-0 w-1 rounded-full bg-gradient-to-b from-primary/40 to-transparent"></div>
                <div className="pl-6">
                  <p className="max-w-4xl whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
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
                            className="mb-3 block text-lg font-bold text-foreground"
                          >
                            {line}
                          </span>
                        );
                      }

                      return (
                        <span
                          key={index}
                          className="mb-1.5 block leading-relaxed text-muted-foreground"
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
                    Time Logged
                  </div>
                  <div className="text-3xl font-bold text-foreground tabular-nums">
                    {minToHHMM(duration)}
                  </div>
                </div>
              </div>
            </div>

            {canEditTimeEntry(bill_status, companyRole) && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-accent hover:text-primary"
                  onClick={e => {
                    e.stopPropagation();
                    setEditEntryId(id);
                    setNewEntryView(true);
                  }}
                  title="Edit entry"
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
                  title="Delete entry"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EntryCard;
