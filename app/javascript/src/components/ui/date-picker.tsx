import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "phosphor-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export function DatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
  className,
  displayFormat = "PPP",
  showIcon = true,
}: {
  date?: Date;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  displayFormat?: string;
  showIcon?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start py-0 text-left font-normal border-input bg-background hover:bg-accent/60",
            !date && "text-muted-foreground",
            className
          )}
        >
          {showIcon && <CalendarIcon className="h-4 w-4 shrink-0" />}
          {date ? (
            <span className={cn("leading-none truncate", showIcon && "ml-2")}>
              {format(date, displayFormat)}
            </span>
          ) : (
            <span className={cn("leading-none truncate", showIcon && "ml-2")}>
              {placeholder}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 rounded-xl border-border bg-popover shadow-lg">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={onSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
