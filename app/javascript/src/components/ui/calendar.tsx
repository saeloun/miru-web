import * as React from "react";
import { CaretLeft, CaretRight } from "phosphor-react";
import { DayPicker } from "react-day-picker";
import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months:
          "flex flex-col sm:flex-row gap-4 sm:gap-6 items-start justify-center",
        month: "space-y-3",
        month_caption:
          "relative flex h-10 items-center justify-center rounded-md bg-muted/40 px-10",
        caption_label: "text-sm font-semibold text-foreground",
        nav: "pointer-events-none absolute inset-x-1 top-1/2 flex -translate-y-1/2 items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "pointer-events-auto static h-7 w-7 border-border bg-background/80 p-0 text-foreground/80 hover:bg-accent hover:text-foreground"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "pointer-events-auto static h-7 w-7 border-border bg-background/80 p-0 text-foreground/80 hover:bg-accent hover:text-foreground"
        ),
        month_grid: "w-full border-separate border-spacing-y-1.5",
        weekdays: "grid grid-cols-7 gap-1",
        weekday:
          "h-9 inline-flex items-center justify-center text-muted-foreground font-medium text-[0.8rem] uppercase tracking-wide",
        week: "grid grid-cols-7 gap-1",
        day: "h-9 w-9 text-center text-sm p-0 relative rounded-md [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].outside)]:bg-accent/60 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-medium text-foreground rounded-md hover:bg-accent/70 aria-selected:opacity-100"
        ),
        range_end: "day-range-end",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-foreground font-semibold",
        outside:
          "day-outside text-muted-foreground/70 opacity-70 aria-selected:bg-accent/60 aria-selected:text-muted-foreground aria-selected:opacity-80",
        disabled: "text-muted-foreground/50 opacity-50",
        range_middle:
          "aria-selected:bg-primary/15 aria-selected:text-foreground rounded-md",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className }) =>
          orientation === "left" ? (
            <CaretLeft className={cn("h-4 w-4", className)} />
          ) : (
            <CaretRight className={cn("h-4 w-4", className)} />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
