import React, { useCallback } from "react";

import { useNavigate } from "react-router-dom";

const defaultClassName = "mr-10 text-base tracking-widest font-medium text-miru-han-purple-600";
const activeClassName = "mr-10 text-base tracking-widest font-bold text-miru-han-purple-1000 border-b-2 border-miru-han-purple-1000";

const TAB_PATH = {
  list: `/engagements`,
  dashboard: `/engagements/dashboard`
}
const Tab = ({ permissions, tabClassName }) => {
  const navigate = useNavigate();

  const handleTabChange = useCallback((key) => {
    const path = TAB_PATH[key];
    if (location.pathname !== path) {
      navigate(path);
    }
  }, [location.pathname]);

  if (!permissions.engagementsDashboard) {
    return (<></>)
  } else {
    return (
      <>
        <div className="border-b border-gray-200 dark:border-gray-700 pt-4">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
            { <li className="mr-3">
              <button className={tabClassName === "dashboard" ? activeClassName : defaultClassName} onClick={() => handleTabChange('dashboard')} >
                DASHBOARD
              </button>
            </li> }
            <li className="mr-3">
              <button className={tabClassName === "list" ? activeClassName : defaultClassName} onClick={() => handleTabChange('list')} >
                LIST
              </button>
            </li>
          </ul>
        </div>
      </>
    );
  }
};

export default Tab;
