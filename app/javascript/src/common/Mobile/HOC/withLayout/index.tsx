/* eslint-disable react/display-name */

import React from "react";

import PropTypes from "prop-types";

import Header from "components/Navbar/Mobile/Header";
import Navigation from "components/Navbar/Mobile/Navigation";
import { useUserContext } from "context/UserContext";

const withLayout =
  (WrappedComponent, includeNavbar, includeSidebar) => props => {
    const { selectedTab, setSelectedTab } = useUserContext();

    return (
      <div className="h-full">
        {includeNavbar && <Header selectedTab={selectedTab} />}
        <WrappedComponent {...props} />
        {includeSidebar && (
          <Navigation isAdminUser setSelectedTab={setSelectedTab} />
        )}
      </div>
    );
  };

withLayout.propTypes = {
  WrappedComponent: PropTypes.any,
  includeNavbar: PropTypes.bool.isRequired,
  includeSidebar: PropTypes.bool.isRequired,
};

withLayout.displayName = "WithLayout";
export default withLayout;
