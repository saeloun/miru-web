import React from "react";
import { cn } from "../../lib/utils";
import { DayInfo } from "../../types/timeTracking";

interface WeekDaySelectorProps {
  dayInfo: DayInfo[];
  selectDate: number;
  setSelectDate: (index: number) => void;
}

const WeekDaySelector: React.FC<WeekDaySelectorProps> = ({
  dayInfo,
  selectDate,
  setSelectDate,
}) => {
  // Render a day button for week view
  const renderDayButton = (d: DayInfo, index: number) => {
    const isToday =
      new Date().toDateString() === new Date(d.fullDate).toDateString();
    const isSelected = index === selectDate;
    const isWeekend = d.day === "SUN" || d.day === "SAT";

    const buttonClasses = cn(
      "relative transition-all duration-200 cursor-pointer text-center rounded-lg border px-3 py-3",
      // Selected state takes priority
      isSelected && "border-primary bg-primary/10 ring-2 ring-primary/20",
      // Today state (only if not selected)
      !isSelected &&
        isToday &&
        "border-primary/50 bg-accent/20 hover:border-primary hover:shadow-lg",
      // Weekend state (only if not selected and not today)
      !isSelected &&
        !isToday &&
        isWeekend &&
        "border-muted bg-muted/20 hover:border-accent hover:bg-accent/10",
      // Default state (only if none of the above)
      !isSelected &&
        !isToday &&
        !isWeekend &&
        "border-border bg-card hover:bg-accent/10 hover:shadow-sm hover:border-primary/30"
    );

    return (
      <button
        key={index}
        onClick={() => setSelectDate(index)}
        aria-label={`Select ${d.day}, ${d.month} ${d.date}${
          isToday ? " (Today)" : ""
        }${isSelected ? " - Currently selected" : ""}`}
        aria-pressed={isSelected}
        className={buttonClasses}
      >
        {/* Today indicator */}
        {isSelected && (
          <div className="absolute -top-1.5 -right-1.5">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full bg-primary h-3 w-3"></span>
            </span>
          </div>
        )}

        <div className="flex flex-col items-center justify-center space-y-1">
          {/* Day name */}
          <p
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.15em]",
              isSelected
                ? "text-primary font-extrabold"
                : isToday
                ? "text-primary font-extrabold"
                : isWeekend
                ? "text-muted-foreground/60"
                : "text-muted-foreground"
            )}
          >
            {d.day}
          </p>

          {/* Date number */}
          <p
            className={cn(
              "text-lg font-bold",
              isSelected || isToday ? "text-primary" : "text-foreground"
            )}
          >
            {parseInt(d.date, 10)}
          </p>

          {/* Month */}
          <p className="text-[9px] font-medium text-muted-foreground">
            {d.month}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="w-full mb-6">
      <div className="grid grid-cols-7 gap-2">
        {dayInfo.map((d, index) => renderDayButton(d, index))}
      </div>
    </div>
  );
};

export default WeekDaySelector;
