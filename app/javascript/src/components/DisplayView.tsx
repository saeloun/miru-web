import React from "react";

import Main from "./Main";
import Navbar from "./Navbar";

const DisplayView = props => {
  const { isAdminUser, user, isDesktop, setIsDesktop } = props;

  window.addEventListener("resize", () =>
    setIsDesktop(window.innerWidth > 1023)
  );

  window.removeEventListener("resize", () =>
    setIsDesktop(window.innerWidth > 1023)
  );

  if (isDesktop) {
    return (
      <div className="absolute inset-0 flex h-full w-full">
        <Navbar isAdminUser={isAdminUser} user={user} />
        <Main {...props} isAdminUser={isAdminUser} isDesktop={isDesktop} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <Main {...props} isAdminUser={isAdminUser} isDesktop={isDesktop} />
    </div>
  );
};

export default DisplayView;
