import React from "react";
import MiruLogo from "../../../images/miru-logo.svg";

const Loader = ({ className = "" }: { className?: string }) => (
  <div
    className={`flex min-h-full w-full items-center justify-center py-10 ${className}`}
  >
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="h-20 w-20 animate-spin rounded-full border-2 border-miru-han-purple-200 border-t-miru-han-purple-1000" />
        <img
          alt="Miru"
          className="absolute h-10 w-10 animate-pulse"
          src={MiruLogo}
        />
      </div>
      <p className="text-sm font-medium tracking-wide text-miru-dark-purple-1000">
        Loading
      </p>
    </div>
  </div>
);

export default Loader;
