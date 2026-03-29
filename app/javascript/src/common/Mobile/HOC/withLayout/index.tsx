/* eslint-disable */
import React from "react";

import Header from "components/Navbar/Mobile/Header";
import Navigation from "components/Navbar/Mobile/Navigation";
import { useUserContext } from "context/UserContext";

type WrappedComponentType = React.ComponentType<any>;

const WithLayout =
  (
    WrappedComponent: WrappedComponentType,
    includeNavbar: boolean,
    includeSidebar: boolean
  ) =>
  props => {
    const { selectedTab, setSelectedTab, companyRole } = useUserContext();

    return (
      <div className="h-full">
        {includeNavbar && <Header selectedTab={selectedTab} />}
        <WrappedComponent {...props} />
        {includeSidebar && <Navigation />}
      </div>
    );
  };

WithLayout.displayName = "WithLayout";

export default WithLayout;
