import React, { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  FileText,
  CurrencyDollar,
  X,
  Timer,
  Briefcase,
  User,
  Tag,
  FloppyDisk,
  Trash,
} from "phosphor-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { DatePicker } from "../ui/date-picker";
import { cn } from "../../lib/utils";
import dayjs from "dayjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useUserContext } from "../../context/UserContext";
import { i18n } from "../../i18n";

interface TimeEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: any) => void;
  selectedDate?: Date;
  existingEntry?: any;
  projects?: any[];
  clients?: any[];
}

export const TimeTrackingEntryDialog: React.FC<TimeEntryFormProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedDate = new Date(),
  existingEntry = null,
  projects = [],
  clients = [],
}) => {
  const { company } = useUserContext();
  const dateFormat =
    company?.date_format || company?.dateFormat || "MM-DD-YYYY";

  const [formData, setFormData] = useState({
    date: dayjs(selectedDate).format(dateFormat),
    project: "",
    client: "",
    duration: "",
    note: "",
    billable: true,
    tags: [],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingEntry) {
      setFormData({
        date: existingEntry.date,
        project: existingEntry.project,
        client: existingEntry.client,
        duration: existingEntry.duration,
        note: existingEntry.note || "",
        billable: existingEntry.billable,
        tags: existingEntry.tags || [],
      });
    }
  }, [existingEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: any = {};
    if (!formData.duration) {
      newErrors.duration = i18n.t("timeTracking.durationRequired");
    }

    if (!formData.project) {
      newErrors.project = i18n.t("timeTracking.projectRequired");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDurationChange = (value: string) => {
    // Auto-format duration input (e.g., "230" -> "2:30")
    const numbers = value.replace(/[^\d]/g, "");
    if (numbers.length <= 2) {
      setFormData({ ...formData, duration: numbers });
    } else {
      const hours = numbers.slice(0, -2);
      const minutes = numbers.slice(-2);
      setFormData({ ...formData, duration: `${hours}:${minutes}` });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <Card className="w-full max-w-2xl mx-4 shadow-2xl border-0 animate-in slide-in-from-bottom-4 duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="h2">
                  {existingEntry
                    ? i18n.t("timeTracking.editTimeEntry")
                    : i18n.t("timeTracking.newTimeEntry")}
                </CardTitle>
                <p className="text-base text-muted-foreground font-medium">
                  {dayjs(formData.date).format("dddd, MMMM D, YYYY")}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-10 w-10 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Duration and Date Row */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Timer className="h-4 w-4 text-primary" />
                  {i18n.t("timeTracking.duration")} *
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={formData.duration}
                    onChange={e => handleDurationChange(e.target.value)}
                    placeholder="0:00"
                    className={cn(
                      "h3 h-14 pr-16",
                      errors.duration &&
                        "border-destructive focus:border-destructive"
                    )}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground font-medium">
                    {i18n.t("hours")}
                  </span>
                </div>
                {errors.duration && (
                  <p className="text-sm text-destructive font-medium">
                    {errors.duration}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Calendar className="h-4 w-4 text-primary" />
                  {i18n.t("date")}
                </Label>
                <DatePicker
                  selected={new Date(formData.date)}
                  onSelect={date =>
                    date &&
                    setFormData({
                      ...formData,
                      date: dayjs(date).format(dateFormat),
                    })
                  }
                  className="h-12"
                />
              </div>
            </div>
            {/* Project and Client */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  {i18n.t("project")} *
                </label>
                <Select
                  value={formData.project?.value || formData.project || ""}
                  onValueChange={value => {
                    const selectedProject = projects.find(
                      p => (p.value || p.id) === value
                    );

                    setFormData({
                      ...formData,
                      project: selectedProject || value,
                    });
                  }}
                >
                  <SelectTrigger
                    className={`w-full ${
                      errors.project ? "border-red-500" : ""
                    }`}
                  >
                    <SelectValue
                      placeholder={i18n.t("timeTracking.selectProject")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project: any) => (
                      <SelectItem
                        key={project.value || project.id}
                        value={project.value || project.id}
                      >
                        {project.label || project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.project && (
                  <p className="text-sm text-red-600 font-medium">
                    {errors.project}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {i18n.t("client")}
                </label>
                <Select
                  value={formData.client?.value || formData.client || ""}
                  onValueChange={value => {
                    const selectedClient = clients.find(
                      c => (c.value || c.id) === value
                    );

                    setFormData({
                      ...formData,
                      client: selectedClient || value,
                    });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={i18n.t("timeTracking.selectClient")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client: any) => (
                      <SelectItem
                        key={client.value || client.id}
                        value={client.value || client.id}
                      >
                        {client.label || client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Note */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {i18n.t("timeTracking.note")}
              </label>
              <textarea
                value={formData.note}
                onChange={e =>
                  setFormData({ ...formData, note: e.target.value })
                }
                placeholder={i18n.t("timeTracking.whatDidYouWorkOn")}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-border hover:border-border focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all resize-none"
              />
            </div>
            {/* Tags and Billable */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, billable: !formData.billable })
                  }
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                    formData.billable
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-muted text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <CurrencyDollar className="h-4 w-4" />
                  <span className="text-base font-medium">
                    {formData.billable
                      ? i18n.t("billable")
                      : i18n.t("nonBillable")}
                  </span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-secondary transition-all"
                >
                  <Tag className="h-4 w-4" />
                  <span className="text-base font-medium">
                    {i18n.t("timeTracking.addTags")}
                  </span>
                </button>
              </div>
              {existingEntry && (
                <button
                  type="button"
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash className="h-5 w-5" />
                </button>
              )}
            </div>
          </form>
        </CardContent>
        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-background rounded-b-2xl">
          <Button variant="outline" onClick={onClose} className="px-6">
            {i18n.t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 bg-primary hover:bg-primary"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {i18n.t("timeTracking.saving")}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FloppyDisk className="h-4 w-4" />
                {existingEntry
                  ? i18n.t("timeTracking.updateEntry")
                  : i18n.t("timeTracking.saveEntry")}
              </span>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

// Mark Time Off Form Component
export const TimeTrackingTimeOffDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  selectedDate?: Date;
}> = ({ isOpen, onClose, onSave, selectedDate = new Date() }) => {
  const { company } = useUserContext();
  const dateFormat =
    company?.date_format || company?.dateFormat || "MM-DD-YYYY";

  const [formData, setFormData] = useState({
    date: dayjs(selectedDate).format(dateFormat),
    type: "vacation",
    duration: "full",
    note: "",
  });

  const timeOffTypes = [
    { value: "vacation", label: i18n.t("timeOffTypes.vacation"), icon: "🏖️" },
    { value: "sick", label: i18n.t("timeOffTypes.sickLeave"), icon: "🏥" },
    {
      value: "personal",
      label: i18n.t("timeOffTypes.personalDay"),
      icon: "👤",
    },
    { value: "holiday", label: i18n.t("timeOffTypes.holiday"), icon: "🎉" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 shadow-2xl border-0 animate-in slide-in-from-bottom-4">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {i18n.t("timeTracking.markTimeOff")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {dayjs(formData.date).format("dddd, MMMM D, YYYY")}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-10 w-10 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Time Off Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {i18n.t("timeTracking.typeOfTimeOff")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {timeOffTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: type.value })
                    }
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                      formData.type === type.value
                        ? "border-primary bg-accent/60"
                        : "border-border hover:border-border"
                    )}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <span className="text-base font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Duration */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {i18n.t("timeTracking.duration")}
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, duration: "full" })}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all",
                    formData.duration === "full"
                      ? "border-primary bg-accent/60 text-primary"
                      : "border-border hover:border-border"
                  )}
                >
                  {i18n.t("fullDay")}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, duration: "half" })}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all",
                    formData.duration === "half"
                      ? "border-primary bg-accent/60 text-primary"
                      : "border-border hover:border-border"
                  )}
                >
                  {i18n.t("halfDay")}
                </button>
              </div>
            </div>
            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {i18n.t("date")}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={e =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-border hover:border-border focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            {/* Note */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {i18n.t("timeTracking.noteOptional")}
              </label>
              <textarea
                value={formData.note}
                onChange={e =>
                  setFormData({ ...formData, note: e.target.value })
                }
                placeholder={i18n.t("timeTracking.addAdditionalDetails")}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-border hover:border-border focus:outline-none focus:ring-2 focus:ring-ring/40 resize-none"
              />
            </div>
          </form>
        </CardContent>
        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-background rounded-b-2xl">
          <Button variant="outline" onClick={onClose} className="px-6">
            {i18n.t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            className="px-6 bg-amber-600 hover:bg-amber-700"
          >
            {i18n.t("timeTracking.markTimeOff")}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TimeTrackingEntryDialog;
