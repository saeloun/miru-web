/* eslint-disable no-unused-vars */

import PropTypes from "prop-types";

const withLayout =
  (WrappedComponent, includeNavbar, includeSidebar) => props => {
    // const { selectedTab, setSelectedTab } = useUserContext();
    // return (
    //   <>
    //     {includeNavbar && <Header selectedTab={selectedTab} />}
    //     <WrappedComponent {...props} />
    //     {includeSidebar && <Navigation isAdminUser={true} setSelectedTab={setSelectedTab} />}
    //   </>
    // );
  };

withLayout.propTypes = {
  WrappedComponent: PropTypes.any,
  includeNavbar: PropTypes.bool.isRequired,
  includeSidebar: PropTypes.bool.isRequired,
};

export default withLayout;
