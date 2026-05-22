import { Roles } from "../constants/index";
import React, { useEffect, useState } from "react";
import UserContext from "../context/UserContext";
import { LocaleProvider, useLocale } from "../context/LocaleContext";
import {
  normalizeLocale,
  loadLocale,
  getActiveLocale,
  getStoredLocale,
  setStoredLocale,
  detectBrowserLocale,
} from "../i18n";
import Loader from "../common/Loader/index";
import Main from "./Main";
import { reportClientError } from "utils/runtimeRecovery";
import {
  getSessionRequestHeaders,
  hasStoredAuthCredentials,
} from "utils/authHeaders";

const AUTH_PATH_PREFIXES = [
  "/user/sign_in",
  "/login",
  "/signup",
  "/password/new",
  "/password/edit",
  "/users/password/edit",
  "/email_confirmation",
];

const isAuthPagePath = (pathname: string) =>
  AUTH_PATH_PREFIXES.some(path => pathname.startsWith(path));

const resolvePreferredLocale = (dbLocale?: string | null) => {
  const storedLocale = normalizeLocale(getStoredLocale());
  const normalizedDbLocale = dbLocale ? normalizeLocale(dbLocale) : null;
  const browserLocale = detectBrowserLocale();

  if (storedLocale && storedLocale !== "en-US") return storedLocale;

  if (normalizedDbLocale && normalizedDbLocale !== "en-US") {
    return normalizedDbLocale;
  }

  return storedLocale || normalizedDbLocale || browserLocale;
};

const PUBLIC_PATH_PATTERNS = [
  /^\/invoices\/[^/]+\/view$/,
  /^\/invoices\/[^/]+\/payments\/success$/,
];

const isPublicPagePath = (pathname: string) =>
  PUBLIC_PATH_PATTERNS.some(pattern => pattern.test(pathname));

const TRANSIENT_AUTH_STATUSES = new Set([429, 500, 502, 503, 504]);
const AUTH_BOOTSTRAP_MAX_RETRIES = 1;
const AUTH_BOOTSTRAP_RETRY_DELAY_MS = 350;
const AUTH_BOOTSTRAP_RECOVERY_POLL_MS = 5000;

type AuthResolution = "authenticated" | "unauthenticated" | "unknown";

type UserDataState = {
  user: any;
  company: any;
  companyRole: string | null;
  loading: boolean;
  authResolution: AuthResolution;
};

const delay = (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

const AppUserContextProvider = ({
  children,
  value,
}: {
  children: React.ReactNode;
  value: any;
}) => {
  const { locale, setLocale } = useLocale();

  return (
    <UserContext.Provider
      value={{
        ...value,
        locale,
        setLocale,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

const AppWithUserData = (props: any) => {
  const isAuthPage = isAuthPagePath(window.location.pathname);
  const isPublicPage = isPublicPagePath(window.location.pathname);
  const [userData, setUserData] = useState<UserDataState>({
    user: null,
    company: null,
    companyRole: null,
    loading: !(isAuthPage || isPublicPage),
    authResolution: isAuthPage || isPublicPage ? "unauthenticated" : "unknown",
  });
  const [localeReady, setLocaleReady] = useState(false);
  const [initialLocale, setInitialLocale] = useState("en-US");

  // Fetch user details from _me endpoint on mount
  useEffect(() => {
    let isCancelled = false;
    let recoveryTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRecoveryPoll = () => {
      if (recoveryTimer) {
        clearTimeout(recoveryTimer);
      }

      recoveryTimer = setTimeout(() => {
        void fetchUserDetails(0);
      }, AUTH_BOOTSTRAP_RECOVERY_POLL_MS);
    };

    const fetchUserDetails = async (attempt: number) => {
      if (isAuthPage || isPublicPage) {
        if (isCancelled) return;

        setUserData({
          user: null,
          company: null,
          companyRole: null,
          loading: false,
          authResolution: "unauthenticated",
        });

        return;
      }

      try {
        const response = await fetch("/api/v1/users/_me", {
          headers: getSessionRequestHeaders(),
          credentials: "include",
        });

        if (response.ok) {
          if (isCancelled) return;

          const data = await response.json();
          setUserData({
            user: data.user,
            company: data.company,
            companyRole: data.company_role,
            loading: false,
            authResolution: "authenticated",
          });

          return;
        }

        const shouldRetryUnauthorized =
          response.status === 401 &&
          hasStoredAuthCredentials() &&
          attempt < AUTH_BOOTSTRAP_MAX_RETRIES;

        const shouldRetryTransientStatus =
          TRANSIENT_AUTH_STATUSES.has(response.status) &&
          attempt < AUTH_BOOTSTRAP_MAX_RETRIES;

        const shouldRetry =
          shouldRetryUnauthorized || shouldRetryTransientStatus;

        if (shouldRetry) {
          reportClientError("auth-bootstrap-retry", response.statusText, {
            reason: "bootstrap-me-transient-status",
            status: response.status,
            attempt,
          });
          await delay(AUTH_BOOTSTRAP_RETRY_DELAY_MS);
          if (isCancelled) return;
          await fetchUserDetails(attempt + 1);

          return;
        }

        if (response.status === 401 || response.status === 403) {
          if (isCancelled) return;

          setUserData({
            user: null,
            company: null,
            companyRole: null,
            loading: false,
            authResolution: "unauthenticated",
          });

          return;
        }

        reportClientError("auth-bootstrap-delayed", response.statusText, {
          reason: "bootstrap-me-unresolved-status",
          status: response.status,
        });
        scheduleRecoveryPoll();
      } catch (error) {
        if (attempt < AUTH_BOOTSTRAP_MAX_RETRIES) {
          reportClientError("auth-bootstrap-retry", error, {
            reason: "bootstrap-me-network-error",
            attempt,
          });
          await delay(AUTH_BOOTSTRAP_RETRY_DELAY_MS);
          if (isCancelled) return;
          await fetchUserDetails(attempt + 1);

          return;
        }

        reportClientError("auth-bootstrap-delayed", error, {
          reason: "bootstrap-me-network-unresolved",
        });
        scheduleRecoveryPoll();
      }
    };

    void fetchUserDetails(0);

    return () => {
      isCancelled = true;
      if (recoveryTimer) {
        clearTimeout(recoveryTimer);
      }
    };
  }, []);

  useEffect(() => {
    const initLocale = async () => {
      const preferredLocale = resolvePreferredLocale(userData.user?.locale);

      await loadLocale(preferredLocale);
      const activeLocale = getActiveLocale();
      setStoredLocale(activeLocale);
      setInitialLocale(activeLocale);
      setLocaleReady(true);
    };

    if (!userData.loading) {
      initLocale();
    }
  }, [userData.loading]);

  const { user, company, companyRole, loading, authResolution } = userData;

  const confirmedUser = user?.confirmed;
  const googleOauthSuccess = props.googleOauthSuccess;
  const avatarUrl = user?.avatar_url;
  const calendarEnabled = user?.calendar_enabled;
  const calendarConnected = user?.calendar_connected;

  const isAdminUser = [Roles.ADMIN, Roles.OWNER].includes(companyRole);

  const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth > 1023);
  const [selectedTab, setSelectedTab] = useState(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const [companyState, setCompany] = useState(company);
  const resolvedCompany = companyState || company;

  const handleOverlayVisibility = (isOverlayVisible: boolean) => {
    const overlayEl = document.getElementById("overlay");
    const overlayClasses = "fixed inset-0 z-60 bg-black bg-opacity-50".split(
      " "
    );
    if (overlayEl) {
      if (isOverlayVisible) {
        overlayEl.classList.add(...overlayClasses);
      } else {
        overlayEl.classList.remove(...overlayClasses);
      }
    }
  };

  useEffect(() => {
    handleOverlayVisibility(false);
  }, []);

  // Update states when user data changes
  useEffect(() => {
    if (user?.avatar_url) {
      setCurrentAvatarUrl(user.avatar_url);
    }
  }, [user]);

  useEffect(() => {
    if (company) {
      setCompany(company);
    }
  }, [company]);

  if (loading || !localeReady) {
    return <Loader className="h-screen" />;
  }

  return (
    <LocaleProvider initialLocale={initialLocale}>
      <AppUserContextProvider
        value={{
          user,
          avatarUrl: currentAvatarUrl,
          setCurrentAvatarUrl,
          companyRole,
          isAdminUser,
          calendarEnabled,
          calendarConnected,
          confirmedUser,
          googleOauthSuccess,
          isDesktop,
          handleOverlayVisibility,
          selectedTab,
          setSelectedTab,
          company: resolvedCompany,
          setCompany,
          loading,
          authResolution,
        }}
      >
        <Main
          {...props}
          company={company}
          companyRole={companyRole}
          googleOauthSuccess={googleOauthSuccess}
          isAdminUser={isAdminUser}
          isDesktop={isDesktop}
          setIsDesktop={setIsDesktop}
          user={user}
        />
      </AppUserContextProvider>
    </LocaleProvider>
  );
};

export default AppWithUserData;
