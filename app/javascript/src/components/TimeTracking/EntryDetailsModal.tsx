import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { minToHHMM } from "../../helpers";
import dayjs from "dayjs";
import EntryCard from "./EntryCard";
import EntryForm from "./EntryForm";
import {
  TimeEntry,
  Client,
  Project,
  EntryList,
} from "../../types/timeTracking";
import { i18n } from "../../i18n";

interface EntryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  entries: TimeEntry[];
  editEntryId: number;
  setEditEntryId: (id: number) => void;
  handleDeleteEntry: (id: number) => void;
  handleDuplicate: (entry: TimeEntry) => void;
  handleResumeTimer: (entry: {
    client: string;
    project: string;
    projectId: number;
    note?: string;
  }) => void;
  setNewEntryView: (view: boolean) => void;
  newEntryView: boolean;
  // Form props
  clients: Record<string, Client[]>;
  projects: Record<string, Project[]>;
  entryList: EntryList;
  fetchEntries: (from: string, to: string) => void;
  fetchEntriesofMonth: (from: string, to: string) => void;
  refreshVisibleEntries: () => Promise<boolean>;
  handleAddEntryDateChange: (date: string) => void;
  handleFilterEntry: (params: any) => void;
  handleRelocateEntry: (id: number, date: string) => void;
  removeLocalStorageItems: () => void;
  selectedEmployeeId: number;
  setSelectedFullDate: (date: string) => void;
  setUpdateView: (view: boolean) => void;
}

const EntryDetailsModal: React.FC<EntryDetailsModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  entries,
  editEntryId,
  setEditEntryId,
  handleDeleteEntry,
  handleDuplicate,
  handleResumeTimer,
  setNewEntryView,
  newEntryView,
  // Form props
  clients,
  projects,
  entryList,
  fetchEntries,
  fetchEntriesofMonth,
  refreshVisibleEntries,
  handleAddEntryDateChange,
  handleFilterEntry,
  handleRelocateEntry,
  removeLocalStorageItems,
  selectedEmployeeId,
  setSelectedFullDate,
  setUpdateView,
}) => {
  const totalDuration =
    entries?.reduce((sum, entry) => sum + entry.duration, 0) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{dayjs(selectedDate).format("dddd, MMMM D, YYYY")}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {i18n.t("total")}: {minToHHMM(totalDuration)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Add Entry Button */}
          {!newEntryView && !editEntryId && (
            <Button
              onClick={() => setNewEntryView(true)}
              className="w-full"
              variant="outline"
            >
              <span className="mr-2">+</span>
              {i18n.t("timeTracking.addEntry")}
            </Button>
          )}

          {/* New Entry Form */}
          {newEntryView && !editEntryId && (
            <EntryForm
              clients={clients}
              editEntryId={0}
              entryList={entryList}
              fetchEntries={fetchEntries}
              fetchEntriesofMonth={fetchEntriesofMonth}
              refreshVisibleEntries={refreshVisibleEntries}
              handleAddEntryDateChange={handleAddEntryDateChange}
              handleDeleteEntry={handleDeleteEntry}
              handleFilterEntry={handleFilterEntry}
              handleRelocateEntry={handleRelocateEntry}
              projects={projects}
              removeLocalStorageItems={removeLocalStorageItems}
              selectedEmployeeId={selectedEmployeeId}
              selectedFullDate={selectedDate}
              setEditEntryId={setEditEntryId}
              setNewEntryView={setNewEntryView}
              setSelectedFullDate={setSelectedFullDate}
              setUpdateView={setUpdateView}
            />
          )}

          {/* Entries List */}
          {!newEntryView && entries && entries.length > 0 ? (
            <div className="space-y-2">
              {entries.map(entry =>
                editEntryId === entry.id ? (
                  <EntryForm
                    key={entry.id}
                    clients={clients}
                    editEntryId={editEntryId}
                    entryList={entryList}
                    fetchEntries={fetchEntries}
                    fetchEntriesofMonth={fetchEntriesofMonth}
                    refreshVisibleEntries={refreshVisibleEntries}
                    handleAddEntryDateChange={handleAddEntryDateChange}
                    handleDeleteEntry={handleDeleteEntry}
                    handleFilterEntry={handleFilterEntry}
                    handleRelocateEntry={handleRelocateEntry}
                    projects={projects}
                    removeLocalStorageItems={removeLocalStorageItems}
                    selectedEmployeeId={selectedEmployeeId}
                    selectedFullDate={selectedDate}
                    setEditEntryId={setEditEntryId}
                    setNewEntryView={setNewEntryView}
                    setSelectedFullDate={setSelectedFullDate}
                    setUpdateView={setUpdateView}
                  />
                ) : (
                  <EntryCard
                    key={entry.id}
                    projectId={entry.project_id}
                    handleDeleteEntry={handleDeleteEntry}
                    handleDuplicate={handleDuplicate}
                    handleResumeTimer={handleResumeTimer}
                    setEditEntryId={setEditEntryId}
                    setNewEntryView={setNewEntryView}
                    {...entry}
                  />
                )
              )}
            </div>
          ) : (
            !newEntryView &&
            !editEntryId && (
              <div className="text-center py-8 text-muted-foreground">
                {i18n.t("timeTracking.noEntriesForDayShort")}
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EntryDetailsModal;
