import React from "react";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { Calendar } from "phosphor-react";

const DatesInWeek: React.FC<Iprops> = ({
  view,
  dayInfo,
  selectDate,
  setSelectDate,
}) =>
  view === "day" ? (
    <div className="w-full mb-6">
      <div className="flex justify-between gap-3">
        {dayInfo.map((d, index) => {
          const isToday =
            new Date().toDateString() === new Date(d.fullDate).toDateString();
          const isSelected = index === selectDate;
          const isWeekend = d.day === "SUN" || d.day === "SAT";

          return (
            <button
              key={index}
              className={cn(
                "relative flex-1 rounded-xl border-2 px-4 py-3 text-center transition-all duration-300 hover:shadow-lg group",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-xl transform scale-105 ring-4 ring-primary/20"
                  : isToday
                  ? "border-primary/50 bg-accent/20 hover:border-primary hover:bg-accent/40"
                  : isWeekend
                  ? "border-muted bg-muted/30 hover:border-accent hover:bg-accent/20"
                  : "border-border bg-card hover:border-primary/30 hover:bg-accent/10"
              )}
              onClick={() => {
                setSelectDate(index);
              }}
            >
              {isToday && !isSelected && (
                <div className="absolute -top-2 -right-2 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-primary"></span>
                </div>
              )}
              <div className="flex flex-col items-center justify-center space-y-1">
                <p
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-[0.15em] transition-colors",
                    isSelected
                      ? "text-primary-foreground"
                      : isToday
                      ? "text-primary font-extrabold"
                      : isWeekend
                      ? "text-muted-foreground/70"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {d.day}
                </p>
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg transition-all",
                    isSelected
                      ? "bg-primary-foreground/20"
                      : isToday
                      ? "bg-primary/10"
                      : "group-hover:bg-accent/30"
                  )}
                >
                  <p
                    className={cn(
                      "text-xl font-bold transition-colors",
                      isSelected
                        ? "text-primary-foreground"
                        : isToday
                        ? "text-primary"
                        : "text-foreground group-hover:text-primary"
                    )}
                  >
                    {parseInt(d.date, 10)}
                  </p>
                </div>
                <p
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    isSelected
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  )}
                >
                  {d.month}
                </p>
                {isToday && (
                  <Badge
                    variant={isSelected ? "secondary" : "default"}
                    className={cn(
                      "text-[9px] mt-1 h-4 px-1.5 font-bold",
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    TODAY
                  </Badge>
                )}
              </div>
              {isSelected && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                  <Calendar className="h-4 w-4 text-primary animate-bounce" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  ) : (
    // dates for week view
    <div className="w-full mb-6">
      <div className="grid grid-cols-7 gap-2">
        {dayInfo.map((d, index) => {
          const isToday =
            new Date().toDateString() === new Date(d.fullDate).toDateString();
          const isWeekend = d.day === "SUN" || d.day === "SAT";

          return (
            <div
              key={index}
              className={cn(
                "relative rounded-lg border px-3 py-3 text-center transition-all duration-200",
                isToday
                  ? "border-primary bg-accent/20 shadow-md"
                  : isWeekend
                  ? "border-muted bg-muted/20"
                  : "border-border bg-card hover:bg-accent/10 hover:shadow-sm"
              )}
            >
              {isToday && (
                <div className="absolute -top-1.5 -right-1.5">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                </div>
              )}
              <div className="flex flex-col items-center justify-center space-y-1">
                <p
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-[0.15em]",
                    isToday
                      ? "text-primary font-extrabold"
                      : isWeekend
                      ? "text-muted-foreground/60"
                      : "text-muted-foreground"
                  )}
                >
                  {d.day}
                </p>
                <p
                  className={cn(
                    "text-lg font-bold",
                    isToday ? "text-primary" : "text-foreground"
                  )}
                >
                  {parseInt(d.date, 10)}
                </p>
                <p
                  className={cn(
                    "text-[9px] font-medium",
                    "text-muted-foreground"
                  )}
                >
                  {d.month}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

interface Iprops {
  view: string;
  dayInfo: any[];
  selectDate: number;
  setSelectDate: any;
}

export default DatesInWeek;
