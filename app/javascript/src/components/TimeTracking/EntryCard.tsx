import React from "react";
import { minToHHMM } from "helpers";
import {
  Trash2,
  Edit3,
  Copy,
  Clock,
  Briefcase,
  FileText,
  DollarSign,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { useUserContext } from "context/UserContext";
import { Roles } from "../../constants";

interface props {
  id: number;
  client: string;
  project: string;
  note: string;
  duration: number;
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
  handleDeleteEntry,
  setEditEntryId,
  bill_status,
  setNewEntryView,
  handleDuplicate,
}) => {
  const { isDesktop, companyRole } = useUserContext();

  const handleCardClick = () => {
    if (!isDesktop) {
      setEditEntryId(id);
      setNewEntryView(true);
    }
  };

  const getBillStatusBadge = () => {
    switch (bill_status) {
      case "unbilled":
        return (
          <Badge
            variant="default"
            className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300"
          >
            <DollarSign className="w-3 h-3 mr-1" />
            UNBILLED
          </Badge>
        );
      case "non_billable":
        return (
          <Badge
            variant="secondary"
            className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-300"
          >
            <FileText className="w-3 h-3 mr-1" />
            NON BILLABLE
          </Badge>
        );
      case "billed":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300"
          >
            <DollarSign className="w-3 h-3 mr-1" />
            BILLED
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      className={cn(
        "mb-4 transition-all duration-300 hover:shadow-xl group",
        "bg-card border-border hover:border-primary/30",
        !isDesktop && "cursor-pointer active:scale-[0.99]"
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left Section - Project Info */}
          <div className="flex-1 space-y-3">
            {/* Client & Project Header */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <span className="text-xl font-bold text-foreground tracking-tight">
                  {client}
                </span>
              </div>
              <span className="text-muted-foreground">•</span>
              <span className="text-lg font-semibold text-muted-foreground">
                {project}
              </span>
            </div>

            {/* Status Badge (Mobile) */}
            <div className="lg:hidden">{getBillStatusBadge()}</div>

            {/* Note */}
            {note && (
              <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                <p className="text-sm font-medium text-muted-foreground whitespace-pre-wrap break-words line-clamp-3 leading-relaxed">
                  {note}
                </p>
              </div>
            )}
          </div>

          {/* Duration (Mobile) */}
          <div className="lg:hidden flex items-center gap-2 text-primary">
            <Clock className="w-5 h-5" />
            <span className="text-2xl font-black tracking-tight">
              {minToHHMM(duration)}
            </span>
          </div>

          {/* Right Section - Desktop Only */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Status Badge */}
            <div>{getBillStatusBadge()}</div>

            {/* Duration */}
            <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 rounded-lg border border-primary/20">
              <Clock className="w-5 h-5 text-primary" />
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Duration
                </span>
                <span className="text-2xl font-black text-primary tracking-tight">
                  {minToHHMM(duration)}
                </span>
              </div>
            </div>

            {/* Actions */}
            {canEditTimeEntry(bill_status, companyRole) && (
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
                  onClick={e => {
                    e.stopPropagation();
                    handleDuplicate(id);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
                  onClick={e => {
                    e.stopPropagation();
                    setEditEntryId(id);
                  }}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
                  onClick={e => {
                    e.stopPropagation();
                    handleDeleteEntry(id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
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
