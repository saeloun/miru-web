import React, { useEffect, useState } from "react";
import { GlobeHemisphereWest, SpinnerGap } from "phosphor-react";
import { profileApi } from "apis/api";
import { useUserContext } from "context/UserContext";
import { LANGUAGE_OPTIONS, SupportedLocale, setStoredLocale, t } from "../../i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const CompactLocaleSwitcher: React.FC = () => {
  const { locale, setLocale } = useUserContext();
  const [selectedLocale, setSelectedLocale] = useState(
    locale as SupportedLocale
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedLocale(locale as SupportedLocale);
  }, [locale]);

  const handleChange = async (nextLocale: SupportedLocale) => {
    setSelectedLocale(nextLocale);
    setStoredLocale(nextLocale);
    setIsSaving(true);

    try {
      await profileApi.update({ user: { locale: nextLocale } });
    } catch (_error) {
      // On auth pages, profile API fails (no session) - that's OK,
      // locale is already saved to localStorage
    }

    setLocale(nextLocale);
    window.location.reload();
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1">
      <GlobeHemisphereWest size={16} className="text-muted-foreground" />
      <Select
        value={selectedLocale}
        onValueChange={handleChange}
        disabled={isSaving}
      >
        <SelectTrigger
          aria-label={t("common.language")}
          className="h-8 min-w-[128px] border-0 bg-transparent px-1 text-sm shadow-none focus:ring-0 focus:ring-offset-0"
          data-testid="compact-locale-switcher"
        >
          <SelectValue placeholder={t("common.language")} />
        </SelectTrigger>
        <SelectContent align="end">
          {LANGUAGE_OPTIONS.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isSaving && (
        <SpinnerGap
          size={14}
          className="animate-spin text-muted-foreground"
          aria-label={t("common.saving")}
        />
      )}
    </div>
  );
};

export default CompactLocaleSwitcher;
