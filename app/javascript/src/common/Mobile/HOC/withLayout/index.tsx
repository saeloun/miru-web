/* eslint-disable */
import React from "react";

import PropTypes from "prop-types";

import Header from "components/Navbar/Mobile/Header";
import Navigation from "components/Navbar/Mobile/Navigation";
import { useUserContext } from "context/UserContext";

const WithLayout =
  (WrappedComponent, includeNavbar, includeSidebar) => props => {
    const { selectedTab, setSelectedTab, isAdminUser } = useUserContext();

    return (
      <div className="h-full">
        {includeNavbar && <Header selectedTab={selectedTab} />}
        <WrappedComponent {...props} />
        {includeSidebar && (
          <Navigation
            isAdminUser={isAdminUser}
            setSelectedTab={setSelectedTab}
          />
        )}
      </div>
    );
  };

WithLayout.propTypes = {
  WrappedComponent: PropTypes.any,
  includeNavbar: PropTypes.bool.isRequired,
  includeSidebar: PropTypes.bool.isRequired,
};

WithLayout.displayName = "WithLayout";

export default WithLayout;
