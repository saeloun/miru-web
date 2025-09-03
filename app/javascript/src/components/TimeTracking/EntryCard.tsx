import React from "react";
import { minToHHMM } from "helpers";
import { Trash, PencilSimple, Clock, Briefcase } from "phosphor-react";
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

  return (
    <Card
      className={cn(
        "mb-4 transition-all duration-200 hover:shadow-lg group relative overflow-hidden",
        "bg-white border-slate-200 hover:border-blue-400",
        !isDesktop && "cursor-pointer active:scale-[0.99]",
        "before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-blue-500 before:opacity-0 before:transition-opacity hover:before:opacity-100"
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
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shadow-sm">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900">
                        {client}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-base font-medium text-slate-700">
                        {project}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:hidden">
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">
                    {minToHHMM(duration)}
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">
                    hours
                  </div>
                </div>
              </div>
            </div>

            {/* Note Section with Better Typography */}
            {note && (
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 to-transparent rounded-full"></div>
                <div className="pl-6">
                  <p className="text-base leading-relaxed text-slate-700 whitespace-pre-wrap max-w-4xl">
                    {note.split("\n").map((line, index) => {
                      // Check if line starts with bullet point
                      if (line.trim().startsWith("•")) {
                        return (
                          <span key={index} className="block mb-2 pl-4">
                            <span className="text-blue-500 mr-3 -ml-4">▸</span>
                            <span className="text-slate-600 text-sm">
                              {line.replace("•", "").trim()}
                            </span>
                          </span>
                        );
                      }

                      // Bold the first line (title)
                      if (index === 0) {
                        return (
                          <span
                            key={index}
                            className="block font-bold text-lg text-slate-900 mb-3"
                          >
                            {line}
                          </span>
                        );
                      }

                      return (
                        <span
                          key={index}
                          className="block mb-1.5 text-slate-600 leading-relaxed"
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
            <div className="bg-gradient-to-br from-blue-50 via-white to-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-md">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Time Logged
                  </div>
                  <div className="text-3xl font-bold text-slate-900 tabular-nums">
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
                  className="h-9 w-9 hover:bg-slate-100 hover:text-blue-600"
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
                  className="h-9 w-9 hover:bg-red-50 hover:text-red-600"
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
