import React, { createContext, useContext, useState, useCallback } from "react";

import {
  getActiveLocale,
  loadLocale,
  normalizeLocale,
  setStoredLocale,
  SUPPORTED_LOCALES,
} from "../i18n";

interface LocaleContextType {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  isLocaleReady: boolean;
  supportedLocales: string[];
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "en-US",
  setLocale: async () => {},
  isLocaleReady: true,
  supportedLocales: SUPPORTED_LOCALES,
});

export const useLocale = () => useContext(LocaleContext);

interface LocaleProviderProps {
  initialLocale?: string;
  children: React.ReactNode;
}

export const LocaleProvider: React.FC<LocaleProviderProps> = ({
  initialLocale = "en-US",
  children,
}) => {
  const [locale, setLocaleState] = useState(initialLocale);
  const [isLocaleReady, setIsLocaleReady] = useState(true);

  const setLocale = useCallback(async (newLocale: string) => {
    setIsLocaleReady(false);
    const success = await loadLocale(newLocale);
    const effectiveLocale = success
      ? getActiveLocale()
      : normalizeLocale(newLocale);
    setLocaleState(effectiveLocale);
    setStoredLocale(effectiveLocale);
    setIsLocaleReady(true);
  }, []);

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        isLocaleReady,
        supportedLocales: SUPPORTED_LOCALES,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
};

export default LocaleContext;
