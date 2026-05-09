import React, { useState } from "react";
import { Check, CaretDown } from "phosphor-react";
import { cn } from "../../../../../lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../../../ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../ui/popover";
import { i18n } from "../../../../../i18n";
import { FORM_CONTROL_SURFACE_CLASS } from "../../../../ui/form-control-classes";

type Option = { label: string; value: string };

type CountryComboboxProps = {
  id?: string;
  options: Option[];
  value: Option;
  onChange: (option: Option) => void;
  isErr?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
};

export const CountryCombobox = ({
  id,
  options = [],
  value,
  onChange,
  isErr = false,
  placeholder = i18n.t("profile.selectCountry"),
  searchPlaceholder = i18n.t("profile.searchCountry"),
  emptyMessage = i18n.t("profile.noCountryFound"),
  className = "",
}: CountryComboboxProps) => {
  const [open, setOpen] = useState(false);

  const selected = options.find(o => o.value === value?.value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md px-3 py-2 text-sm",
            FORM_CONTROL_SURFACE_CLASS,
            isErr && "!border-destructive focus-visible:ring-destructive/35",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {selected ? selected.label : placeholder}
          </span>
          <CaretDown size={16} weight="regular" className="ml-2 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: "var(--radix-popover-trigger-width)" }}
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  <Check
                    size={14}
                    weight="bold"
                    className={cn(
                      "mr-2 shrink-0",
                      selected?.value === option.value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
