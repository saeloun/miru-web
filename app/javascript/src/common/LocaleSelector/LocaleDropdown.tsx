import React, { useState, useRef, useEffect } from "react";
import { Check, MagnifyingGlass } from "phosphor-react";

import { LOCALE_GROUPS, type LocaleInfo } from "./localeData";

interface LocaleDropdownProps {
  currentLocale: string;
  onSelect: (locale: string) => void;
  onClose: () => void;
  direction?: "up" | "down";
}

const LocaleDropdown: React.FC<LocaleDropdownProps> = ({
  currentLocale,
  onSelect,
  onClose,
  direction = "up",
}) => {
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const filteredGroups = LOCALE_GROUPS.map((group) => ({
    ...group,
    locales: group.locales.filter((locale) => {
      const q = search.toLowerCase();
      return (
        locale.nativeName.toLowerCase().includes(q) ||
        locale.code.toLowerCase().includes(q) ||
        (locale.englishName && locale.englishName.toLowerCase().includes(q))
      );
    }),
  })).filter((group) => group.locales.length > 0);

  const renderLocaleItem = (locale: LocaleInfo) => {
    const isSelected = locale.code === currentLocale;
    return (
      <button
        key={locale.code}
        onClick={() => onSelect(locale.code)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors min-h-[44px]"
        role="option"
        aria-selected={isSelected}
      >
        <span className="w-4 flex-shrink-0">
          {isSelected && (
            <Check className="h-4 w-4 text-primary" weight="bold" />
          )}
        </span>
        <span className={isSelected ? "font-medium" : ""}>
          {locale.nativeName}
          {locale.englishName && (
            <span className="text-muted-foreground ml-1">
              ({locale.englishName})
            </span>
          )}
        </span>
      </button>
    );
  };

  return (
    <div
      ref={dropdownRef}
      className={`absolute z-50 min-w-[240px] bg-popover border border-border rounded-lg shadow-lg overflow-hidden ${
        direction === "up" ? "bottom-full mb-1" : "top-full mt-1"
      }`}
      role="listbox"
      aria-label="Select language"
    >
      <div className="border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <MagnifyingGlass className="h-4 w-4 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search languages..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        {filteredGroups.map((group, idx) => (
          <div key={group.label} role="group" aria-label={group.label}>
            {idx > 0 && <div className="border-t border-border" />}
            <div className="px-3 py-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {group.label}
              </span>
            </div>
            {group.locales.map(renderLocaleItem)}
          </div>
        ))}
        {filteredGroups.length === 0 && (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">
            No languages found
          </div>
        )}
      </div>
    </div>
  );
};

export default LocaleDropdown;
