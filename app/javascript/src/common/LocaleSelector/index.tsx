import React, { useState, useCallback } from "react";
import { GlobeSimple, CaretDown, Spinner } from "phosphor-react";
import { toast } from "sonner";

import { useLocale } from "../../context/LocaleContext";
import { setStoredLocale } from "../../i18n";
import { getLocaleShortCode } from "./localeData";
import LocaleDropdown from "./LocaleDropdown";

interface LocaleSelectorProps {
  dropdownDirection?: "up" | "down";
  showLabel?: boolean;
  className?: string;
  onLocaleChange?: (locale: string) => void;
}

const LocaleSelector: React.FC<LocaleSelectorProps> = ({
  dropdownDirection = "up",
  showLabel = false,
  className = "",
  onLocaleChange,
}) => {
  const { locale, setLocale, isLocaleReady } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelect = useCallback(
    async (newLocale: string) => {
      if (newLocale === locale) {
        setIsOpen(false);
        return;
      }

      setIsSaving(true);
      setIsOpen(false);

      try {
        await setLocale(newLocale);
        setStoredLocale(newLocale);

        if (onLocaleChange) {
          await onLocaleChange(newLocale);
        }
      } catch {
        toast.error("Failed to change language");
      } finally {
        setIsSaving(false);
      }
    },
    [locale, setLocale, onLocaleChange]
  );

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg border border-transparent px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
        aria-label="Select language"
        disabled={isSaving || !isLocaleReady}
      >
        {isSaving ? (
          <Spinner className="h-4 w-4 animate-spin" />
        ) : (
          <GlobeSimple className="h-4 w-4" />
        )}
        <span className="font-medium">{getLocaleShortCode(locale)}</span>
        <CaretDown className="h-3 w-3" />
      </button>
      {isOpen && (
        <LocaleDropdown
          currentLocale={locale}
          onSelect={handleSelect}
          onClose={() => setIsOpen(false)}
          direction={dropdownDirection}
        />
      )}
    </div>
  );
};

export default LocaleSelector;
