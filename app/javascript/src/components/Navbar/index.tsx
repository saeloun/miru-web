import React from "react";

import Header from "./Header";
import Options from "./Options";
import UserActions from "./UserActions";
import UserInfo from "./UserInfo";

const Navbar = ({ isAdminUser, user }) => (
  <div className="fixed top-0 bottom-0 left-0 flex h-full w-1/6 flex-col justify-between shadow-2xl">
    <div>
      <Header />
      <Options isAdminUser={isAdminUser} />
    </div>
    <div>
      <UserActions />
      <UserInfo user={user} />
    </div>
  </div>
);

export default Navbar;
