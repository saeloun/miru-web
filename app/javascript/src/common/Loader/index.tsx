import React from "react";
import MiruLogo from "../../../images/miru-logo.svg";

const Loader = ({ className = "" }: { className?: string }) => (
  <div
    className={`flex min-h-full w-full items-center justify-center bg-neutral-100 py-10 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 ${className}`}
  >
    <div className="flex flex-col items-center gap-4 rounded-xl border border-black/10 bg-white/80 px-6 py-5 shadow-sm dark:border-white/10 dark:bg-neutral-900/80">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="h-20 w-20 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100" />
        <img alt="Miru" className="absolute h-10 w-10" src={MiruLogo} />
      </div>
      <p className="text-sm font-medium tracking-wide text-neutral-700 dark:text-neutral-300">
        Loading...
      </p>
    </div>
  </div>
);

export default Loader;
