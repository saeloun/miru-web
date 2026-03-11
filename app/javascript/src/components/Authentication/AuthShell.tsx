import React, { useEffect, useState } from "react";
import { MIRU_APP_URL } from "constants/index";
import { MiruLogoWithTextSVG } from "miruIcons";
import dashboardPreview from "../../../../assets/images/auth/dashboard-preview.png";
import dashboardPreviewDark from "../../../../assets/images/auth/dashboard-preview-dark.png";
import invoicesPreview from "../../../../assets/images/auth/invoices-preview.png";
import invoicesPreviewDark from "../../../../assets/images/auth/invoices-preview-dark.png";
import paymentsPreview from "../../../../assets/images/auth/payments-preview.png";
import paymentsPreviewDark from "../../../../assets/images/auth/payments-preview-dark.png";
import timeTrackingPreview from "../../../../assets/images/auth/time-tracking-preview.png";
import timeTrackingPreviewDark from "../../../../assets/images/auth/time-tracking-preview-dark.png";
import AuthThemeToggle from "./AuthThemeToggle";

interface AuthShellProps {
  children: React.ReactNode;
  description: string;
  title: string;
}

const slides = [
  {
    id: "dashboard",
    image: dashboardPreview,
    darkImage: dashboardPreviewDark,
    title: "Company pulse",
    description:
      "See revenue, active projects, and team momentum without digging for it.",
    mainPosition: "24% 12%",
    cardPosition: "20% 10%",
    mainScale: 1.18,
    cardScale: 1.12,
  },
  {
    id: "invoices",
    image: invoicesPreview,
    darkImage: invoicesPreviewDark,
    title: "Billing command",
    description:
      "Keep drafts, overdue balances, and paid work in the same place.",
    mainPosition: "30% 14%",
    cardPosition: "28% 12%",
    mainScale: 1.2,
    cardScale: 1.14,
  },
  {
    id: "time-tracking",
    image: timeTrackingPreview,
    darkImage: timeTrackingPreviewDark,
    title: "Clear weekly flow",
    description:
      "Week-by-week time entry stays current without turning into busywork.",
    mainPosition: "34% 18%",
    cardPosition: "34% 16%",
    mainScale: 1.18,
    cardScale: 1.12,
  },
  {
    id: "payments",
    image: paymentsPreview,
    darkImage: paymentsPreviewDark,
    title: "Cash ledger",
    description:
      "Every payment lands in one ledger with method, status, and source.",
    mainPosition: "36% 16%",
    cardPosition: "38% 12%",
    mainScale: 1.22,
    cardScale: 1.16,
  },
];

const AuthShell = ({ children, description, title }: AuthShellProps) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const activePreview = slides[activeSlide];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide(current => (current + 1) % slides.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const syncTheme = () => {
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
    };

    syncTheme();

    const ThemeObserver = window.MutationObserver;
    const observer = new ThemeObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="absolute right-4 top-4 z-30">
        <AuthThemeToggle />
      </div>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:items-start">
          <div className="mx-auto flex w-full max-w-md flex-col">
            <a
              className="mb-8 inline-flex items-center justify-center self-center"
              href={MIRU_APP_URL}
              rel="noreferrer noopener"
            >
              <img
                alt="Miru"
                className="h-10 w-auto object-contain brightness-0 dark:invert"
                src={MiruLogoWithTextSVG}
              />
            </a>
            <div className="rounded-3xl border border-border bg-card/95 p-6 shadow-xl backdrop-blur sm:p-8">
              <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  {title}
                </h1>
                <p className="text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </div>
              {children}
            </div>
          </div>
          <div className="hidden lg:flex lg:pt-[4.5rem]">
            <div className="flex h-full min-h-[36rem] w-full flex-col rounded-[32px] border border-border bg-card/80 p-5 shadow-2xl backdrop-blur">
              <div className="mb-5 flex items-start justify-between gap-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                    One place for time, invoices, and payments
                  </h2>
                  <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                    Keep the day clear, keep billing moving, and keep cash
                    visible.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-3xl bg-background shadow-sm ring-1 ring-border">
                  <div className="overflow-hidden rounded-3xl bg-card shadow-inner">
                    <div
                      className="flex transition-transform duration-500 ease-out"
                      style={{
                        transform: `translateX(-${activeSlide * 100}%)`,
                      }}
                    >
                      {slides.map(slide => (
                        <div className="min-w-full" key={slide.id}>
                          <img
                            alt={`${slide.title} preview`}
                            className="aspect-[16/10] w-full object-cover"
                            src={
                              theme === "dark" ? slide.darkImage : slide.image
                            }
                            style={{
                              objectPosition: slide.mainPosition,
                              transform: `scale(${slide.mainScale})`,
                              transformOrigin: "center",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
                  <div className="absolute inset-x-8 bottom-8 flex items-end justify-between gap-4 rounded-[22px] border border-white/40 bg-background/75 px-5 py-4 shadow-2xl backdrop-blur-xl">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        {activePreview.title}
                      </p>
                      <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-foreground">
                        {activePreview.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {slides.map((slide, index) => (
                        <button
                          aria-label={`Show ${slide.title}`}
                          className={`h-2.5 rounded-full transition-all ${
                            index === activeSlide
                              ? "w-8 bg-foreground shadow-sm"
                              : "w-2.5 bg-muted-foreground/30"
                          }`}
                          key={slide.id}
                          onClick={() => setActiveSlide(index)}
                          type="button"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
