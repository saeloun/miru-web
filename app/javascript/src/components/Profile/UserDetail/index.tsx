import React from "react";

import Header from "../Header";

const UserDetails = () => {
  return (
    <div className="flex flex-col w-4/5">
      <Header
        title={'Profile Settings'}
        subTitle={'View and manage profile settings'}
      />
      <div className="py-10 pl-10 mt-4 bg-miru-gray-100 h-screen">
        <p>User Details Page Coming up</p>
      </div>
    </div>
  );
};

export default UserDetails;
