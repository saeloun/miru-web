import React from "react";

import Header from "./Header";
import Options from "./Options";
import UserActions from "./UserActions";
import UserInfo from "./UserInfo";

const Navbar = ({ user, companyRole }) => (
  <div className="fixed top-0 bottom-0 left-0 flex h-full w-1/6 flex-col justify-between shadow-2xl">
    <Header />
    <div className="flex h-full flex-col justify-between overflow-y-auto">
      <Options companyRole={companyRole} />
      <UserActions />
    </div>
    <UserInfo user={user} />
  </div>
);

export default Navbar;
